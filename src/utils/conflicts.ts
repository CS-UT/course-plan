import type { Course, CourseSession } from '@/types';

export function hasTimeConflict(a: CourseSession, b: CourseSession): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

export function hasExamConflict(a: Course, b: Course): boolean {
  if (!a.examDate || !b.examDate) return false;
  return a.examDate === b.examDate && a.examTime === b.examTime;
}

export function findTimeConflicts(
  course: Course,
  selectedCourses: Course[],
): Course[] {
  const conflicts: Course[] = [];
  for (const selected of selectedCourses) {
    if (selected.courseCode === course.courseCode && selected.group === course.group) continue;
    for (const sessionA of course.sessions) {
      for (const sessionB of selected.sessions) {
        if (hasTimeConflict(sessionA, sessionB)) {
          conflicts.push(selected);
          break;
        }
      }
      if (conflicts.includes(selected)) break;
    }
  }
  return conflicts;
}

export function findExamConflicts(
  course: Course,
  selectedCourses: Course[],
): Course[] {
  return selectedCourses.filter(
    (s) =>
      !(s.courseCode === course.courseCode && s.group === course.group) &&
      hasExamConflict(course, s),
  );
}
