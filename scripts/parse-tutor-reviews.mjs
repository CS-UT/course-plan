#!/usr/bin/env node

/**
 * Parse tutor reviews from a Telegram channel export (JSON).
 *
 * Handles multiple message formats:
 *   A: «name» + میانگین امتیاز + hashtag (structured ratings)
 *   B: 👤 name + 🧑🏻‍🏫 نام درس + ✍️ نظر (course-specific prose)
 *   B+: Same as B with extra sections (📊بارم بندی, 🎲وضع نمره دهی, etc.)
 *   C: 👤 name + 🎖 درجه + 🏢 محل کار + ✍️ نظر (profile + prose)
 *   D: 👤 استاد: name + 🏢 دانشکده + ✍️ نظر
 *   E: 👤 name + 🏢 محل کار + ✍️ نظر (simple)
 *
 * Usage: node scripts/parse-tutor-reviews.mjs [path-to-result.json]
 *
 * Outputs:
 *   src/data/tutors.json         — array of TutorProfile
 *   src/data/tutor-name-map.json — { professorName: tutorId }
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COURSES_FILE = join(__dirname, '..', 'src', 'data', 'courses.json');
const TUTORS_OUT = join(__dirname, '..', 'src', 'data', 'tutors.json');
const MAP_OUT = join(__dirname, '..', 'src', 'data', 'tutor-name-map.json');

// ── Persian normalization ──────────────────────────────────────────

function normalizePersian(str) {
  if (!str) return '';
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/ئ/g, 'ی')
    .replace(/[\u200c\u200d\u00a0]/g, ' ') // ZWNJ, ZWJ, NBSP → space
    .replace(/\s+/g, ' ')
    .trim();
}

function persianDigitToLatin(str) {
  return str
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 48))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48));
}

function nameParts(name) {
  return new Set(normalizePersian(name).split(' ').filter(Boolean));
}

// ── Extract text & links from Telegram message ─────────────────────

function extractText(msg) {
  if (typeof msg.text === 'string') return msg.text;
  if (!Array.isArray(msg.text)) return '';
  return msg.text
    .map((part) => (typeof part === 'string' ? part : part.text || ''))
    .join('');
}

/** Extract the first profile.ut.ac.ir URL from text_link entities */
function extractProfileUrl(msg) {
  if (!Array.isArray(msg.text)) return null;
  for (const part of msg.text) {
    if (typeof part === 'object' && part.type === 'text_link' && part.href) {
      if (part.href.includes('profile.ut.ac.ir')) return part.href;
    }
  }
  return null;
}

function extractHashtags(msg) {
  const tags = [];
  if (!Array.isArray(msg.text)) return tags;
  for (const part of msg.text) {
    if (typeof part === 'object' && part.type === 'hashtag') {
      tags.push(part.text);
    }
  }
  if (Array.isArray(msg.text_entities)) {
    for (const ent of msg.text_entities) {
      if (ent.type === 'hashtag' && !tags.includes(ent.text)) {
        tags.push(ent.text);
      }
    }
  }
  return tags;
}

// ── Format A: «name» + میانگین امتیاز ──────────────────────────────

function parseFormatA(msg, text, hashtags) {
  const nameMatch = text.match(/«([^»]+)»/);
  if (!nameMatch) return null;
  if (!text.includes('میانگین امتیاز')) return null;
  if (hashtags.length === 0) return null;

  const rawName = nameMatch[1].trim();
  if (rawName.includes('،') || rawName.includes(' - ') || rawName.includes(' و ')) return null;

  const courseName = hashtags[0].replace(/^#/, '').replace(/_/g, ' ');

  const parseRating = (label) => {
    const re = new RegExp(label + ':\\s*([\\d.۰-۹٠-٩]+)\\s*از\\s*10');
    const m = text.match(re);
    if (!m) return 0;
    return parseFloat(persianDigitToLatin(m[1])) || 0;
  };

  const flags = {};
  for (const label of ['نهاد', 'خلاصه نویسی', 'میان ترم', 'حضور و غیاب', 'تکلیف']) {
    const re = new RegExp(label + ':\\s*(✅|❌)');
    const m = text.match(re);
    if (m) flags[label] = m[1] === '✅';
  }

  const comments = [];
  const commentsMatch = text.match(/✍️\s*نظرات\s*:\s*\n([\s\S]*?)(?:\n\n@|\n@|$)/);
  if (commentsMatch) {
    for (const part of commentsMatch[1].split('●')) {
      const c = part.trim();
      if (c) comments.push(c);
    }
  }

  return {
    rawName,
    profileUrl: null,
    rank: null,
    workplace: null,
    courseName,
    review: {
      courseName,
      averageRating: parseRating('میانگین امتیاز'),
      teachingRating: parseRating('اخلاق و تدریس'),
      gradingRating: parseRating('نمره دهی استاد'),
      flags,
      comments,
      messageId: msg.id,
      date: msg.date ? msg.date.split('T')[0] : '',
    },
  };
}

// ── Formats B-F: 👤 name based ─────────────────────────────────────

/** Known section emoji markers for Format B Extended */
const SECTION_MARKERS = [
  ['📚', 'منبع تدریس'],
  ['✅', 'حضور و غیاب'],
  ['📊', 'بارم بندی'],
  ['🎲', 'وضع نمره دهی'],
  ['📝', 'سطح امتحان'],
  ['📖', 'تمرین و کوییز'],
  ['🗞', 'توضیحات بیشتر'],
];

function parseFormatBCDEF(msg, text) {
  // Must start with 👤
  if (!text.includes('👤')) return null;

  // Extract name — multiple patterns
  let rawName = null;

  // "👤 استاد: name" (Format D)
  const dMatch = text.match(/👤\s*استاد:\s*(.+)/);
  if (dMatch) rawName = dMatch[1].trim();

  // "👤 name" (Formats B, C, E) — name is on the same line
  if (!rawName) {
    const bMatch = text.match(/👤\s*(.+)/);
    if (bMatch) rawName = bMatch[1].trim();
  }

  if (!rawName) return null;

  // Clean name: remove trailing parenthetical URLs and profile links
  rawName = rawName.replace(/\s*\(https?:\/\/[^)]+\)\s*$/, '').trim();
  // Remove trailing newlines / other emoji markers that may have been captured
  rawName = rawName.split('\n')[0].trim();

  if (!rawName || rawName.length > 60) return null;

  // Extract profile URL
  const profileUrl = extractProfileUrl(msg);

  // Extract rank: 🎖 درجه: استاد
  const rankMatch = text.match(/🎖\s*درجه:\s*(.+)/);
  const rank = rankMatch ? rankMatch[1].trim() : null;

  // Extract workplace: 🏢 محل کار: ... or 🏢 دانشکده ...
  const wpMatch = text.match(/🏢\s*(?:محل کار:|دانشکده)\s*(.+)/);
  const workplace = wpMatch ? wpMatch[1].trim() : null;

  // Extract course name: 🧑🏻‍🏫 نام درس: ...  (the emoji has ZWJ chars)
  const courseMatch = text.match(/نام درس:\s*(.+)/);
  const courseName = courseMatch ? courseMatch[1].trim() : '';

  // Extract review text and sections
  const comments = [];
  const sections = {};

  // Find where the review text starts (after ✍️ نظر:)
  const reviewStart = text.match(/✍️\s*نظر(?:ات)?\s*:\s*\n?/);
  if (reviewStart) {
    const afterReview = text.slice(reviewStart.index + reviewStart[0].length);

    // Check for structured sections (Format B Extended)
    let hasSections = false;
    for (const [emoji] of SECTION_MARKERS) {
      if (afterReview.includes(emoji) && emoji !== '✅') {
        hasSections = true;
        break;
      }
    }

    if (!hasSections) {
      // Simple prose review — everything until @UTGroups or @UT400 or end
      const prose = afterReview
        .replace(/@UT(?:Groups|400)\s*$/, '')
        .replace(/@UTGroups\s*$/, '')
        .trim();
      if (prose) comments.push(prose);
    }
  } else {
    // No ✍️ marker — some messages have the review text directly after metadata
    // Try to find text after all metadata lines
    const lines = text.split('\n');
    let collecting = false;
    const proseLines = [];
    for (const line of lines) {
      if (collecting) {
        const trimmed = line.trim();
        if (trimmed.startsWith('@UT')) break;
        proseLines.push(line);
      } else if (line.includes('🏢') || line.includes('🎖')) {
        // Skip metadata lines, start collecting after blank line
      } else if (line.trim() === '' && proseLines.length === 0) {
        collecting = true;
      }
    }
    const prose = proseLines.join('\n').trim();
    if (prose) comments.push(prose);
  }

  // Parse structured sections for Format B Extended
  for (const [emoji, label] of SECTION_MARKERS) {
    const re = new RegExp(emoji + '\\s*' + label.replace(/\s/g, '\\s*') + '\\s*\\n([\\s\\S]*?)(?=\\n(?:📚|✅|📊|🎲|📝|📖|🗞|@UT)|$)');
    const m = text.match(re);
    if (m) {
      const content = m[1].replace(/@UT(?:Groups|400)\s*$/, '').trim();
      if (content) sections[label] = content;
    }
  }

  if (comments.length === 0 && Object.keys(sections).length === 0) return null;

  return {
    rawName,
    profileUrl,
    rank,
    workplace,
    courseName,
    review: {
      courseName,
      comments,
      ...(Object.keys(sections).length > 0 ? { sections } : {}),
      messageId: msg.id,
      date: msg.date ? msg.date.split('T')[0] : '',
    },
  };
}

// ── Combined parser ────────────────────────────────────────────────

function parseReview(msg) {
  const text = extractText(msg);
  const hashtags = extractHashtags(msg);

  // Try Format A first (most specific)
  const a = parseFormatA(msg, text, hashtags);
  if (a) return a;

  // Try Formats B-F
  return parseFormatBCDEF(msg, text);
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const inputPath = process.argv[2] || join(homedir(), 'Downloads', 'result.json');

  console.log(`Reading Telegram export: ${inputPath}`);
  const raw = await readFile(inputPath, 'utf-8');
  const data = JSON.parse(raw);
  const messages = data.messages || [];
  console.log(`Total messages: ${messages.length}`);

  // Parse all tutor reviews
  const parsed = [];
  for (const msg of messages) {
    if (msg.type !== 'message') continue;
    const result = parseReview(msg);
    if (result) parsed.push(result);
  }
  console.log(`Parsed tutor reviews: ${parsed.length}`);

  // Group by normalized name, merge metadata
  const tutorMap = new Map();
  for (const { rawName, profileUrl, rank, workplace, courseName, review } of parsed) {
    const key = normalizePersian(rawName);
    if (!tutorMap.has(key)) {
      tutorMap.set(key, { displayName: normalizePersian(rawName), profileUrl: null, rank: null, workplace: null, reviews: [] });
    }
    const entry = tutorMap.get(key);
    entry.reviews.push(review);
    // Keep the most informative metadata
    if (profileUrl && !entry.profileUrl) entry.profileUrl = profileUrl;
    if (rank && !entry.rank) entry.rank = rank;
    if (workplace && !entry.workplace) entry.workplace = workplace;
  }
  console.log(`Unique tutors (after normalization): ${tutorMap.size}`);

  // Load courses.json for matching
  const coursesRaw = await readFile(COURSES_FILE, 'utf-8');
  const coursesData = JSON.parse(coursesRaw);
  const professorNames = [...new Set(coursesData.courses.map((c) => c.professor).filter(Boolean))];
  console.log(`Unique professors in courses.json: ${professorNames.length}`);

  // Build tutor profiles
  const tutors = [];
  let id = 0;
  for (const [, tutor] of tutorMap) {
    id++;
    const tutorId = `tutor-${id}`;
    tutor.id = tutorId;
    const profile = {
      id: tutorId,
      name: tutor.displayName,
      ...(tutor.rank ? { rank: tutor.rank } : {}),
      ...(tutor.workplace ? { workplace: tutor.workplace } : {}),
      ...(tutor.profileUrl ? { profileUrl: tutor.profileUrl } : {}),
      reviews: tutor.reviews,
    };
    tutors.push(profile);
  }

  // Match professors to best tutor profile
  // For each professor, find all candidate tutors and pick the best one
  const nameMap = {};
  let matchCount = 0;

  for (const profName of professorNames) {
    const profSet = nameParts(profName);
    let bestTutor = null;
    let bestScore = 0;

    for (const [, tutor] of tutorMap) {
      const tutorSet = nameParts(tutor.displayName);
      const common = new Set([...tutorSet].filter((p) => profSet.has(p)));
      if (common.size === 0) continue;

      const tutorAllFound = [...tutorSet].every((p) => profSet.has(p));
      const profAllFound = [...profSet].every((p) => tutorSet.has(p));

      if (!tutorAllFound && !profAllFound) continue;

      const smaller = Math.min(tutorSet.size, profSet.size);
      const larger = Math.max(tutorSet.size, profSet.size);
      if (smaller < 2 || larger - smaller > 2) continue;

      // Score: prefer exact size match, then closer size, then more reviews
      const sizeMatch = tutorSet.size === profSet.size ? 1000 : 0;
      const closeness = smaller / larger * 100;
      const reviewBonus = Math.min(tutor.reviews.length, 50);
      const score = sizeMatch + closeness + reviewBonus;

      if (score > bestScore) {
        bestScore = score;
        bestTutor = tutor;
      }
    }

    if (bestTutor) {
      nameMap[profName] = bestTutor.id;
      matchCount++;
      console.log(`  ✓ "${bestTutor.displayName}" → "${profName}"`);
    }
  }

  console.log(`\nMatched ${matchCount}/${professorNames.length} professors to tutor profiles`);
  const unmatchedProfs = professorNames.filter((p) => !nameMap[p]);
  console.log(`Professors in courses.json without reviews: ${unmatchedProfs.length}`);

  await writeFile(TUTORS_OUT, JSON.stringify(tutors, null, 2) + '\n', 'utf-8');
  console.log(`\nWrote ${tutors.length} tutor profiles → ${TUTORS_OUT}`);

  await writeFile(MAP_OUT, JSON.stringify(nameMap, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${Object.keys(nameMap).length} name mappings → ${MAP_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
