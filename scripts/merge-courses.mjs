#!/usr/bin/env node

/**
 * Merge all scraped course JSON files from src/data/gathered_data/
 * into a single src/data/courses.json
 *
 * gathered_data files use the compact schema (plain array of objects with
 * short keys). This script expands them into the full Course object format
 * that the app expects.
 *
 * Files are processed in alphabetical order — later files override earlier
 * ones for the same (code, group) key. Name your files accordingly
 * (e.g. 001.json, 002.json).
 *
 * Usage: node scripts/merge-courses.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GATHERED_DIR = join(__dirname, '..', 'src', 'data', 'gathered_data');
const OUTPUT_FILE = join(__dirname, '..', 'src', 'data', 'courses.json');

const GENDER_MAP = { 'پسران': 'male', 'دختران': 'female', 'مخت': 'mixed' };

/** Normalize Arabic character variants to their Persian equivalents */
function normalizePersian(str) {
  if (!str) return '';
  return str
    .replace(/ي/g, 'ی')   // Arabic yeh  → Persian yeh
    .replace(/ك/g, 'ک')   // Arabic kaf  → Persian kaf
    .replace(/أ/g, 'ا')   // Arabic alef with hamza above
    .replace(/إ/g, 'ا')   // Arabic alef with hamza below
    .replace(/ؤ/g, 'و')   // Arabic waw with hamza
    .replace(/ة/g, 'ه');  // Arabic taa marbuta → heh
}

function parseSession(s) {
  // "0 13:00-15:00" → { dayOfWeek: 0, startTime: "13:00", endTime: "15:00" }
  const [day, times] = s.split(' ');
  const [start, end] = times.split('-');
  return {
    dayOfWeek: parseInt(day),
    startTime: start,
    endTime: end,
  };
}

// Known prereq labels that leak into the notes field from older scrapes
const PREREQ_LABELS = ['پيش نياز', 'پیش نیاز', 'همنياز', 'همنیاز', 'معادل', 'متضاد'];

function cleanNotes(raw) {
  if (!raw) return '';
  let s = raw.trim();
  // Strip bare label words that leaked from the prereqs column
  for (const label of PREREQ_LABELS) {
    if (s === label) return '';
  }
  return s;
}

function expandCourse(c) {
  const [examDate, examTime] = c.exam ? c.exam.split(' ') : ['', ''];
  return {
    courseCode: c.code,
    group: c.group,
    courseName: normalizePersian(c.name),
    unitCount: c.units,
    gender: GENDER_MAP[c.gender] || 'mixed',
    professor: normalizePersian(c.professor),
    sessions: (c.sessions || []).map(parseSession),
    examDate: examDate || '',
    examTime: examTime || '',
    location: normalizePersian(c.location || ''),
    prerequisites: normalizePersian(c.prereqs || ''),
    notes: normalizePersian(cleanNotes(c.notes)),
    grade: '',
  };
}

async function main() {
  const files = (await readdir(GATHERED_DIR))
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error('No JSON files found in', GATHERED_DIR);
    process.exit(1);
  }

  console.log(`Found ${files.length} source file(s):`);

  const merged = new Map();
  for (const file of files) {
    const raw = await readFile(join(GATHERED_DIR, file), 'utf-8');
    const courses = JSON.parse(raw);
    console.log(`  ${file}: ${courses.length} courses`);

    for (const course of courses) {
      const key = `${course.code}-${course.group}`;
      merged.set(key, course);
    }
  }

  const output = {
    semester: '14042',
    semesterLabel: 'نیمسال دوم ۱۴۰۴-۱۴۰۵',
    department: 'دانشکده ریاضی، آمار و علوم کامپیوتر',
    courses: Array.from(merged.values()).map(expandCourse),
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`\nMerged ${output.courses.length} unique courses → ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
