import type { Course, ScheduleEntryType } from '@/types';

export const ENTRY_TYPE_LABELS: Record<ScheduleEntryType, string> = {
  course: 'درس',
  tutorial: 'حل تمرین',
  other: 'موارد دیگر',
};

export function isCreditCourse(course: Pick<Course, 'entryType'>): boolean {
  return !course.entryType || course.entryType === 'course';
}

export function isInternalCourseCode(courseCode: string): boolean {
  return /^(?:manual|local)[-_]/i.test(courseCode.trim());
}

export function getCourseCodeLabel(courseCode: string): string {
  return isInternalCourseCode(courseCode) ? '—' : courseCode.trim() || '—';
}

export function getCourseIdentityLabel(courseCode: string, group: number): string {
  return isInternalCourseCode(courseCode)
    ? `گروه ${group}`
    : `${courseCode}-${group}`;
}
