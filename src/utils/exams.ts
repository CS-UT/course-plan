import type { Course } from '@/types';

type ExamLabelInput = {
  examDate?: string;
  examDay?: number;
};

type ExamScheduleInput = ExamLabelInput & {
  examTime?: string;
};

const PERSIAN_ORDINALS = [
  '',
  'اول',
  'دوم',
  'سوم',
  'چهارم',
  'پنجم',
  'ششم',
  'هفتم',
  'هشتم',
  'نهم',
  'دهم',
];

export function getExamLabel(examDate = '', examDay?: number): string {
  if (examDate) return examDate;
  if (!examDay) return '';

  const ordinal = PERSIAN_ORDINALS[examDay] ?? String(examDay);
  return examDay === 1
    ? `روز ${ordinal} پس از آزمون عمومی`
    : `روز ${ordinal}`;
}

export function getCourseExamLabel(course: ExamLabelInput): string {
  return getExamLabel(course.examDate, course.examDay);
}

export function getExamSlotKey(course: ExamScheduleInput): string {
  const dateKey = course.examDate
    ? `date:${course.examDate}`
    : course.examDay
      ? `relative:${course.examDay}`
      : '';

  return dateKey && course.examTime ? `${dateKey}@${course.examTime}` : '';
}

export function compareExamSlots(a: Course, b: Course): number {
  if (a.examDay && b.examDay && a.examDay !== b.examDay) return a.examDay - b.examDay;
  if (a.examDay && !b.examDay) return -1;
  if (!a.examDay && b.examDay) return 1;
  if (a.examDate !== b.examDate) return a.examDate.localeCompare(b.examDate);
  return a.examTime.localeCompare(b.examTime);
}

export function formatExamSchedule(course: ExamScheduleInput): string {
  const label = getCourseExamLabel(course);
  return label && course.examTime ? `${label} - ${course.examTime}` : label;
}
