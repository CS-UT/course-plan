import moment from 'moment-jalaali';
import type { SelectedCourse } from '@/types';

// Semester 14042 = نیمسال دوم ۱۴۰۴-۱۴۰۵
// Approximate: Bahman 1404 (Feb 2026) to Khordad 1405 (June 2026)
const SEMESTER_START_JALALI = '1404/11/18'; // ~Feb 7, 2026
const SEMESTER_END_JALALI = '1405/03/31';   // ~Jun 21, 2026

// dayOfWeek mapping to iCalendar BYDAY values
const DAY_TO_ICAL: Record<number, string> = {
  6: 'SA', // شنبه
  0: 'SU', // یکشنبه
  1: 'MO', // دوشنبه
  2: 'TU', // سه‌شنبه
  3: 'WE', // چهارشنبه
  4: 'TH', // پنجشنبه
  5: 'FR', // جمعه
};

function formatICalDateLocal(m: moment.Moment, time: string): string {
  const [h, min] = time.split(':');
  const d = m.clone().hour(Number(h)).minute(Number(min)).second(0);
  return d.format('YYYYMMDD') + 'T' + String(h).padStart(2, '0') + String(min).padStart(2, '0') + '00';
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function findFirstOccurrence(semesterStart: moment.Moment, dayOfWeek: number): moment.Moment {
  // dayOfWeek: 6=Saturday, 0=Sunday, 1=Monday, etc.
  // moment uses: 0=Sunday, 1=Monday, ..., 6=Saturday
  const targetMomentDay = dayOfWeek === 6 ? 6 : dayOfWeek;
  const start = semesterStart.clone();
  while (start.day() !== targetMomentDay) {
    start.add(1, 'day');
  }
  return start;
}

export function generateICS(courses: SelectedCourse[]): string {
  const semesterStart = moment(SEMESTER_START_JALALI, 'jYYYY/jMM/jDD');
  const semesterEnd = moment(SEMESTER_END_JALALI, 'jYYYY/jMM/jDD');
  const untilDate = semesterEnd.format('YYYYMMDD') + 'T235959Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//plan.csut.ir//Course Schedule//FA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:برنامه هفتگی دانشکده',
    'X-WR-TIMEZONE:Asia/Tehran',
    // VTIMEZONE for Asia/Tehran
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Tehran',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0330',
    'TZOFFSETTO:+0330',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  for (const course of courses) {
    if (course.mode === 'hover') continue;

    for (let i = 0; i < course.sessions.length; i++) {
      const session = course.sessions[i];
      const icalDay = DAY_TO_ICAL[session.dayOfWeek];
      if (!icalDay) continue;

      const firstDate = findFirstOccurrence(semesterStart, session.dayOfWeek);

      const dtstart = formatICalDateLocal(firstDate, session.startTime);
      const dtend = formatICalDateLocal(firstDate, session.endTime);

      const description = [
        `استاد: ${course.professor}`,
        course.location ? `محل: ${course.location}` : '',
        course.examDate ? `امتحان: ${course.examDate} ساعت ${course.examTime}` : '',
        course.notes ? `توضیحات: ${course.notes}` : '',
      ].filter(Boolean).join('\\n');

      lines.push(
        'BEGIN:VEVENT',
        `DTSTART;TZID=Asia/Tehran:${dtstart}`,
        `DTEND;TZID=Asia/Tehran:${dtend}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${icalDay};UNTIL=${untilDate}`,
        `SUMMARY:${escapeICalText(course.courseName)} (گروه ${course.group})`,
        `DESCRIPTION:${escapeICalText(description)}`,
        course.location ? `LOCATION:${escapeICalText(course.location)}` : '',
        `UID:${course.courseCode}-${course.group}-${i}@plan.csut.ir`,
        'END:VEVENT',
      );

      // Add exam event if available
      if (course.examDate && course.examTime && i === 0) {
        const examMoment = moment(course.examDate, 'jYYYY/jMM/jDD');
        if (examMoment.isValid()) {
          const examStart = formatICalDateLocal(examMoment, course.examTime);
          // Assume 2-hour exam duration
          const examEndMoment = examMoment.clone();
          const [eh, em] = course.examTime.split(':').map(Number);
          examEndMoment.hour(eh + 2).minute(em);
          const examEnd = examEndMoment.format('YYYYMMDD') + 'T' + String(eh + 2).padStart(2, '0') + String(em).padStart(2, '0') + '00';

          lines.push(
            'BEGIN:VEVENT',
            `DTSTART;TZID=Asia/Tehran:${examStart}`,
            `DTEND;TZID=Asia/Tehran:${examEnd}`,
            `SUMMARY:امتحان ${escapeICalText(course.courseName)}`,
            `DESCRIPTION:${escapeICalText(`گروه ${course.group} — استاد: ${course.professor}`)}`,
            course.location ? `LOCATION:${escapeICalText(course.location)}` : '',
            `UID:exam-${course.courseCode}-${course.group}@plan.csut.ir`,
            'END:VEVENT',
          );
        }
      }
    }
  }

  lines.push('END:VCALENDAR');

  // Filter out empty lines
  return lines.filter(Boolean).join('\r\n');
}

export function downloadICS(courses: SelectedCourse[]) {
  const icsContent = generateICS(courses);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'schedule.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
