#!/usr/bin/env node

/**
 * Parse tutor reviews from a Telegram channel export (JSON).
 *
 * Extracts tutor profiles (name, ratings, flags, comments, reactions)
 * and matches them to professors in courses.json.
 *
 * Usage: node scripts/parse-tutor-reviews.mjs [path-to-result.json]
 *        Defaults to ~/Downloads/result.json
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

/** Get name parts as a Set for order-independent comparison */
function nameParts(name) {
  return new Set(normalizePersian(name).split(' ').filter(Boolean));
}

// ── Extract text from Telegram message ─────────────────────────────

function extractText(msg) {
  if (typeof msg.text === 'string') return msg.text;
  if (!Array.isArray(msg.text)) return '';
  return msg.text
    .map((part) => (typeof part === 'string' ? part : part.text || ''))
    .join('');
}

function extractHashtags(msg) {
  const tags = [];
  if (!Array.isArray(msg.text)) return tags;
  for (const part of msg.text) {
    if (typeof part === 'object' && part.type === 'hashtag') {
      tags.push(part.text);
    }
  }
  // Also check text_entities
  if (Array.isArray(msg.text_entities)) {
    for (const ent of msg.text_entities) {
      if (ent.type === 'hashtag' && !tags.includes(ent.text)) {
        tags.push(ent.text);
      }
    }
  }
  return tags;
}

// ── Parse a single tutor review message ────────────────────────────

function parseReview(msg) {
  const text = extractText(msg);
  const hashtags = extractHashtags(msg);

  // Must have a name in «» and a rating
  const nameMatch = text.match(/«([^»]+)»/);
  if (!nameMatch) return null;
  if (!text.includes('میانگین امتیاز')) return null;
  if (hashtags.length === 0) return null;

  const rawName = nameMatch[1].trim();

  // Skip compound entries (multiple tutors)
  if (rawName.includes('،') || rawName.includes(' - ') || rawName.includes(' و ')) return null;

  const courseName = hashtags[0]
    .replace(/^#/, '')
    .replace(/_/g, ' ');

  // Parse ratings
  const parseRating = (label) => {
    const re = new RegExp(label + ':\\s*([\\d.۰-۹٠-٩]+)\\s*از\\s*10');
    const m = text.match(re);
    if (!m) return 0;
    return parseFloat(persianDigitToLatin(m[1])) || 0;
  };

  const averageRating = parseRating('میانگین امتیاز');
  const teachingRating = parseRating('اخلاق و تدریس');
  const gradingRating = parseRating('نمره دهی استاد');

  // Parse boolean flags
  const flags = {};
  const flagLabels = ['نهاد', 'خلاصه نویسی', 'میان ترم', 'حضور و غیاب', 'تکلیف'];
  for (const label of flagLabels) {
    const re = new RegExp(label + ':\\s*(✅|❌)');
    const m = text.match(re);
    if (m) flags[label] = m[1] === '✅';
  }

  // Parse comments
  const comments = [];
  const commentsMatch = text.match(/✍️\s*نظرات\s*:\s*\n([\s\S]*?)(?:\n\n@|\n@|$)/);
  if (commentsMatch) {
    const raw = commentsMatch[1];
    for (const part of raw.split('●')) {
      const c = part.trim();
      if (c) comments.push(c);
    }
  }

  const date = msg.date ? msg.date.split('T')[0] : '';

  return {
    rawName,
    courseName,
    review: {
      courseName,
      averageRating,
      teachingRating,
      gradingRating,
      flags,
      comments,
      date,
    },
  };
}

// ── Match tutors to courses.json professors ────────────────────────

function matchTutorToProf(tutorName, professorNames) {
  const tutorSet = nameParts(tutorName);

  let bestMatch = null;
  let bestScore = 0;
  let ambiguous = false;

  for (const profName of professorNames) {
    const profSet = nameParts(profName);

    const common = new Set([...tutorSet].filter((p) => profSet.has(p)));
    if (common.size === 0) continue;

    // Exact set equality (handles name order differences)
    if (common.size === tutorSet.size && common.size === profSet.size) {
      return profName; // confident exact match
    }

    // Subset match: all parts of one set found in the other
    const tutorAllFound = [...tutorSet].every((p) => profSet.has(p));
    const profAllFound = [...profSet].every((p) => tutorSet.has(p));

    if (tutorAllFound || profAllFound) {
      const smaller = Math.min(tutorSet.size, profSet.size);
      const larger = Math.max(tutorSet.size, profSet.size);
      if (smaller >= 2 && larger - smaller <= 2) {
        const score = smaller / larger;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = profName;
          ambiguous = false;
        } else if (score === bestScore) {
          ambiguous = true;
        }
      }
    }
  }

  if (bestMatch && !ambiguous) return bestMatch;
  return null;
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

  // Group by normalized name
  const tutorMap = new Map(); // normalizedName → { displayName, reviews[] }
  for (const { rawName, review } of parsed) {
    const key = normalizePersian(rawName);
    if (!tutorMap.has(key)) {
      tutorMap.set(key, { displayName: normalizePersian(rawName), reviews: [] });
    }
    tutorMap.get(key).reviews.push(review);
  }
  console.log(`Unique tutors (after normalization): ${tutorMap.size}`);

  // Load courses.json for matching
  const coursesRaw = await readFile(COURSES_FILE, 'utf-8');
  const coursesData = JSON.parse(coursesRaw);
  const professorNames = [...new Set(coursesData.courses.map((c) => c.professor).filter(Boolean))];
  console.log(`Unique professors in courses.json: ${professorNames.length}`);

  // Build tutor profiles and match
  const tutors = [];
  const nameMap = {}; // professorName → tutorId
  let matchCount = 0;

  let id = 0;
  for (const [, tutor] of tutorMap) {
    id++;
    const tutorId = `tutor-${id}`;
    const profile = {
      id: tutorId,
      name: tutor.displayName,
      reviews: tutor.reviews,
    };
    tutors.push(profile);

    // Try to match to courses.json
    const match = matchTutorToProf(tutor.displayName, professorNames);
    if (match) {
      nameMap[match] = tutorId;
      matchCount++;
      console.log(`  ✓ "${tutor.displayName}" → "${match}"`);
    }
  }

  console.log(`\nMatched ${matchCount}/${tutorMap.size} tutors to courses.json professors`);

  // Unmatched professors (those in courses.json with no tutor profile)
  const matchedProfs = new Set(Object.keys(nameMap));
  const unmatchedProfs = professorNames.filter((p) => !matchedProfs.has(p));
  console.log(`Professors in courses.json without reviews: ${unmatchedProfs.length}`);

  // Write outputs
  await writeFile(TUTORS_OUT, JSON.stringify(tutors, null, 2) + '\n', 'utf-8');
  console.log(`\nWrote ${tutors.length} tutor profiles → ${TUTORS_OUT}`);

  await writeFile(MAP_OUT, JSON.stringify(nameMap, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${Object.keys(nameMap).length} name mappings → ${MAP_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
