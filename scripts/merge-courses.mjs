#!/usr/bin/env node

/**
 * Import account-specific EMS scrapes for the active semester.
 *
 * gathered_data files use the compact schema (plain array of objects with
 * short keys). This script expands them into the full Course object format
 * that the app expects.
 *
 * Files in gathered_data are ordered snapshots. Active-semester snapshots are
 * unioned because Report #212 hides courses already passed by each student.
 * Later snapshots override earlier ones for the same (code, group) key.
 * عمومی rows come only from the official EMS report. The semester metadata is
 * the final authority for تخصصی rows: it replaces EMS تخصصی rows after being
 * deduplicated by normalized course name and group.
 *
 * Usage: node scripts/merge-courses.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GATHERED_DIR = join(__dirname, '..', 'src', 'data', 'gathered_data');
const SEMESTER_METADATA_FILE = join(__dirname, '..', 'src', 'data', 'semester-14051-specialized.json');
const OUTPUT_FILE = join(__dirname, '..', 'src', 'data', 'courses.json');
const ACTIVE_SNAPSHOT_START = '007.json';

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
    .replace(/ة/g, 'ه')   // Arabic taa marbuta → heh
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s\u200c\u00a0]+/g, ' ')
    .trim();
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
  const normalizedName = normalizePersian(course.courseName).trim();
  const template = templatesByName.get(normalizedName);
  const internalCode = `local-14051-${String(index + 1).padStart(3, '0')}`;

  return {
    courseCode: course.courseCode || template?.courseCode || internalCode,
    group: course.group,
    courseName: normalizedName,
    unitCount: course.unitCount ?? template?.unitCount ?? 0,
    gender: course.gender || template?.gender || 'mixed',
    professor: normalizePersian(course.professor),
    sessions: course.sessions,
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

  const activeFiles = files.filter(file => file >= ACTIVE_SNAPSHOT_START);
  if (activeFiles.length === 0) {
    console.error(`No active EMS snapshots found at or after ${ACTIVE_SNAPSHOT_START}`);
    process.exit(1);
  }

  const officialRows = new Map();
  for (const file of activeFiles) {
    const snapshot = JSON.parse(await readFile(join(GATHERED_DIR, file), 'utf-8'));
    console.log(`Reading active EMS snapshot ${file}: ${snapshot.length} courses`);
    for (const course of snapshot) {
      const key = `${course.code}-${course.group}`;
      // Preserve optional metadata omitted by a later scrape, while preferring
      // every field that the later account actually supplied.
      officialRows.set(key, { ...officialRows.get(key), ...course });
    }
  }
  const officialCourses = Array.from(officialRows.values()).map(expandCourse);
  const semesterMetadata = JSON.parse(await readFile(SEMESTER_METADATA_FILE, 'utf-8'));

  // Older EMS snapshots are used only as metadata templates for final faculty
  // schedule rows that lack a stable code or other details. They never
  // reintroduce تخصصی or عمومی rows by themselves.
  const templatesByName = new Map();
  for (const file of files) {
    const snapshot = JSON.parse(await readFile(join(GATHERED_DIR, file), 'utf-8'));
    for (const course of snapshot.map(expandCourse)) {
      templatesByName.set(normalizePersian(course.courseName).trim(), course);
    }
  }

  const finalSpecializedCourses = semesterMetadata.courses.map((course, index) =>
    expandSpecializedCourse(course, index, templatesByName),
  );
  const uniqueSpecialized = Array.from(new Map(
    finalSpecializedCourses.map(course => [
      `${normalizePersian(course.courseName).trim()}-${course.group}`,
      course,
    ]),
  ).values());
  const officialGeneral = officialCourses.filter(isGeneralCourse);
  const courses = [...officialGeneral, ...uniqueSpecialized];
  const specializedCount = uniqueSpecialized.length;
  const generalCount = officialGeneral.length;

  console.log(`Combined ${activeFiles.length} active EMS snapshots: ${officialCourses.length} unique courses`);
  console.log(`Using ${specializedCount} final, deduplicated faculty-schedule specialized courses`);

  const output = {
    semester: semesterMetadata.semester,
    semesterLabel: semesterMetadata.semesterLabel,
    department: 'دانشکده ریاضی، آمار و علوم کامپیوتر',
    courses,
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`Imported ${specializedCount} specialized + ${generalCount} general courses → ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
