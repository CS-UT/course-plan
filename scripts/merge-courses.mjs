#!/usr/bin/env node

/**
 * Merge university-wide courses from the latest EMS scrape with the
 * faculty-published specialized schedule for the active semester.
 *
 * gathered_data files use the compact schema (plain array of objects with
 * short keys). This script expands them into the full Course object format
 * that the app expects.
 *
 * EMS files are processed in alphabetical order — later files override
 * earlier ones for the same (code, group) key. The resulting عمومی rows are
 * kept, while تخصصی rows are replaced by semester-14051-specialized.json.
 *
 * Usage: node scripts/merge-courses.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GATHERED_DIR = join(__dirname, '..', 'src', 'data', 'gathered_data');
const SPECIALIZED_FILE = join(__dirname, '..', 'src', 'data', 'semester-14051-specialized.json');
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

function isGeneralCourse(course) {
  // Keep this in sync with CourseSearch.tsx. A small number of departmental
  // courses use a 1120 code but have a 6103 equivalent, so they stay تخصصی.
  return course.courseCode.startsWith('1120')
    && !/معادل.*6103\d/.test(course.prerequisites);
}

function expandSpecializedCourse(course, index, templatesByName) {
  const template = templatesByName.get(normalizePersian(course.courseName).trim());
  const internalCode = `local-14051-${String(index + 1).padStart(3, '0')}`;

  return {
    courseCode: course.courseCode || template?.courseCode || internalCode,
    group: course.group,
    courseName: normalizePersian(course.courseName),
    unitCount: course.unitCount ?? template?.unitCount ?? 0,
    gender: course.gender || template?.gender || 'mixed',
    professor: normalizePersian(course.professor),
    sessions: course.sessions,
    // The faculty PDF publishes relative exam days (day 1...day 10 after the
    // general exam) and intentionally leaves calendar dates blank.
    examDate: '',
    examDay: course.examDay,
    examTime: course.examTime,
    location: normalizePersian(course.location || template?.location || ''),
    prerequisites: normalizePersian(course.prerequisites || template?.prerequisites || ''),
    notes: normalizePersian(course.notes || template?.notes || ''),
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

  const legacyCourses = Array.from(merged.values()).map(expandCourse);
  const templatesByName = new Map(
    legacyCourses.map(course => [normalizePersian(course.courseName).trim(), course]),
  );
  const specializedSource = JSON.parse(await readFile(SPECIALIZED_FILE, 'utf-8'));
  const specializedCourses = specializedSource.courses.map((course, index) =>
    expandSpecializedCourse(course, index, templatesByName),
  );
  let generalCourses = legacyCourses.filter(isGeneralCourse);
  try {
    // عمومی offerings are outside this semester update. Preserve the current
    // app records exactly instead of refreshing them from the faculty files.
    const currentOutput = JSON.parse(await readFile(OUTPUT_FILE, 'utf-8'));
    const currentGeneralCourses = currentOutput.courses.filter(isGeneralCourse);
    if (currentGeneralCourses.length > 0) generalCourses = currentGeneralCourses;
  } catch {
    // First build: fall back to عمومی rows expanded from the gathered EMS data.
  }

  const output = {
    semester: specializedSource.semester,
    semesterLabel: specializedSource.semesterLabel,
    department: 'دانشکده ریاضی، آمار و علوم کامپیوتر',
    courses: [...specializedCourses, ...generalCourses],
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`\nMerged ${specializedCourses.length} specialized + ${generalCourses.length} general courses → ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
