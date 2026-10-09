import type { Course } from '@/types';
import { isCreditCourse } from './courses';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// Full entries preserve manual data; old exports contain only a catalog identity.
export function resolveScheduleEntry(value: unknown, catalog: Course[]): Course | null {
  if (!isRecord(value) || typeof value.courseCode !== 'string' || !value.courseCode.trim() || !Number.isInteger(value.group) || Number(value.group) < 1) {
    throw new Error('Invalid schedule identity');
  }
  if (value.courseName === undefined) {
    return catalog.find((course) => course.courseCode === value.courseCode && course.group === value.group) ?? null;
  }
  if (
    !['course', 'tutorial', 'other', undefined].includes(value.entryType as string | undefined) ||
    !['male', 'female', 'mixed'].includes(value.gender as string) ||
    typeof value.courseName !== 'string' || !value.courseName.trim() ||
    !Number.isInteger(value.unitCount) || Number(value.unitCount) < 0 ||
    ['professor', 'examDate', 'examTime', 'location', 'prerequisites', 'notes', 'grade'].some((field) => typeof value[field] !== 'string') ||
    !Array.isArray(value.sessions) || value.sessions.length > 14 ||
    value.sessions.some((session) => !isRecord(session) || !Number.isInteger(session.dayOfWeek) || Number(session.dayOfWeek) < 0 || Number(session.dayOfWeek) > 6 || !isTime(session.startTime) || !isTime(session.endTime) || session.startTime >= session.endTime) ||
    (value.examDay !== undefined && (!Number.isInteger(value.examDay) || Number(value.examDay) < 1)) ||
    (value.examTime !== '' && !isTime(value.examTime)) ||
    (value.relatedCourse !== undefined && (!isRecord(value.relatedCourse) || typeof value.relatedCourse.courseCode !== 'string' || !Number.isInteger(value.relatedCourse.group) || Number(value.relatedCourse.group) < 1))
  ) {
    throw new Error('Invalid schedule entry');
  }
  const course = value as unknown as Course;
  if (isCreditCourse(course)) return { ...course, relatedCourse: undefined };
  return {
    ...course,
    relatedCourse: course.entryType === 'tutorial' ? course.relatedCourse : undefined,
    unitCount: 0,
    professor: '',
    examDate: '',
    examDay: undefined,
    examTime: '',
    location: '',
    prerequisites: '',
    notes: '',
    grade: '',
  };
}
