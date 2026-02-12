import type { SelectedCourse } from '@/types';

// Colors for different courses on the calendar
const COURSE_COLORS = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
  { bg: '#dcfce7', border: '#22c55e', text: '#14532d' },
  { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' },
  { bg: '#fce7f3', border: '#ec4899', text: '#831843' },
  { bg: '#e0e7ff', border: '#6366f1', text: '#312e81' },
  { bg: '#fed7aa', border: '#f97316', text: '#7c2d12' },
  { bg: '#ccfbf1', border: '#14b8a6', text: '#134e4a' },
  { bg: '#fae8ff', border: '#d946ef', text: '#701a75' },
  { bg: '#e2e8f0', border: '#64748b', text: '#1e293b' },
  { bg: '#fecdd3', border: '#f43f5e', text: '#881337' },
];

const HOVER_COLOR = { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };

// FullCalendar uses a base date for timeGridWeek. We use a fixed Saturday.
// 2023-12-30 is a Saturday (شنبه)
const BASE_SATURDAY = '2023-12-30';

function dayOffsetFromSaturday(dayOfWeek: number): number {
  // dayOfWeek: 6=شنبه(Saturday), 0=یکشنبه(Sunday), 1=دوشنبه(Monday),...
  // We need offset from Saturday
  if (dayOfWeek === 6) return 0;
  return dayOfWeek + 1; // 0->1, 1->2, 2->3, 3->4, 4->5
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    courseCode: string;
    group: number;
    courseName: string;
    professor: string;
    unitCount: number;
    location: string;
    examDate: string;
    examTime: string;
    capacity: number;
    enrolled: number;
  };
}

export function coursesToEvents(
  courses: SelectedCourse[],
  colorMap: Map<string, number>,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const course of courses) {
    const colorKey = `${course.courseCode}-${course.group}`;
    let colorIndex = colorMap.get(colorKey);
    if (colorIndex === undefined) {
      colorIndex = colorMap.size % COURSE_COLORS.length;
      colorMap.set(colorKey, colorIndex);
    }

    const isHover = course.mode === 'hover';
    const color = isHover ? HOVER_COLOR : COURSE_COLORS[colorIndex];

    for (let i = 0; i < course.sessions.length; i++) {
      const session = course.sessions[i];
      const offset = dayOffsetFromSaturday(session.dayOfWeek);
      const dateNum = 30 + offset;
      const month = dateNum > 31 ? '01' : '12';
      const day = dateNum > 31 ? String(dateNum - 31).padStart(2, '0') : String(dateNum).padStart(2, '0');
      const year = dateNum > 31 ? '2024' : '2023';

      events.push({
        id: `${course.courseCode}-${course.group}-${i}`,
        title: course.courseName,
        start: `${year}-${month}-${day}T${session.startTime}:00`,
        end: `${year}-${month}-${day}T${session.endTime}:00`,
        backgroundColor: color.bg,
        borderColor: color.border,
        textColor: color.text,
        extendedProps: {
          courseCode: course.courseCode,
          group: course.group,
          courseName: course.courseName,
          professor: course.professor,
          unitCount: course.unitCount,
          location: course.location,
          examDate: course.examDate,
          examTime: course.examTime,
          capacity: course.capacity,
          enrolled: course.enrolled,
        },
      });
    }
  }

  return events;
}

export { BASE_SATURDAY, COURSE_COLORS };
