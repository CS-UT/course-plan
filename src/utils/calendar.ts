import type { SelectedCourse } from '@/types';
import { hasTimeConflict } from './conflicts';

// Neon dark course colors — vibrant backgrounds on deep dark base
const COURSE_COLORS = [
  { bg: '#0a1929', border: '#00f5ff', text: '#00f5ff' },   // neon cyan
  { bg: '#0a1a0f', border: '#00ff88', text: '#00ff88' },   // neon lime
  { bg: '#1a0a1f', border: '#ff00ff', text: '#ff00ff' },   // neon magenta
  { bg: '#1a1a0a', border: '#ffff00', text: '#ffff00' },   // neon yellow
  { bg: '#0a0f1a', border: '#4d8aff', text: '#6da3ff' },   // neon blue
  { bg: '#1a0f0a', border: '#ff6600', text: '#ff8833' },   // neon orange
  { bg: '#0f1a1a', border: '#00e5a0', text: '#00e5a0' },   // neon teal
  { bg: '#1a0a14', border: '#ff4081', text: '#ff4081' },   // neon pink
  { bg: '#14140a', border: '#c8c800', text: '#e0e000' },   // neon gold
  { bg: '#0f0a1a', border: '#a855f7', text: '#c084fc' },   // neon purple
];

const HOVER_COLOR = { bg: '#12121f', border: '#4a4a6a', text: '#6a6a8a' };

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
