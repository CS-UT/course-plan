import type { SelectedCourse } from '@/types';
import { hasTimeConflict } from './conflicts';

// Colors for different courses on the calendar — earthy warm palette
const COURSE_COLORS = [
  { bg: '#F9E4D6', border: '#C2724E', text: '#703B24' },  // Terracotta
  { bg: '#E4E9DC', border: '#7D8B6A', text: '#3A4530' },  // Sage
  { bg: '#F9EDC8', border: '#D4A847', text: '#6B5520' },  // Wheat
  { bg: '#F0D5C0', border: '#B8785A', text: '#5C3520' },  // Clay
  { bg: '#D8E4CF', border: '#6A8B5A', text: '#2E4525' },  // Moss
  { bg: '#F5EAD6', border: '#C4A66A', text: '#6B5530' },  // Sand
  { bg: '#E0D0C0', border: '#8B6B4E', text: '#4A3525' },  // Cedar
  { bg: '#E8D8E0', border: '#9B6B8A', text: '#5A3050' },  // Plum
  { bg: '#E0DDD8', border: '#8B8580', text: '#3D3835' },  // Stone
  { bg: '#F0D0C8', border: '#C25A50', text: '#6B2520' },  // Brick
];

const HOVER_COLOR = { bg: '#F5EDE3', border: '#B8A898', text: '#8B7355' };

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
    prerequisites: string;
    notes: string;
    hasConflict: boolean;
  };
}

export function coursesToEvents(
  courses: SelectedCourse[],
  colorMap: Map<string, number>,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Pre-compute per-session conflict flags
  const sessionConflicts = new Map<string, boolean>();
  for (const course of courses) {
    for (let i = 0; i < course.sessions.length; i++) {
      const session = course.sessions[i];
      const key = `${course.courseCode}-${course.group}-${i}`;
      for (const other of courses) {
        if (other.courseCode === course.courseCode && other.group === course.group) continue;
        for (const otherSession of other.sessions) {
          if (hasTimeConflict(session, otherSession)) {
            sessionConflicts.set(key, true);
            break;
          }
        }
        if (sessionConflicts.has(key)) break;
      }
    }
  }

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
      const conflictKey = `${course.courseCode}-${course.group}-${i}`;

      events.push({
        id: conflictKey,
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
          prerequisites: course.prerequisites,
          notes: course.notes,
          hasConflict: sessionConflicts.has(conflictKey),
        },
      });
    }
  }

  return events;
}

export { BASE_SATURDAY, COURSE_COLORS };
