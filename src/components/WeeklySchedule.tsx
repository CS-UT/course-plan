import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import type { Course, SelectedCourse } from '@/types';
import { useSchedule } from '@/hooks/useSchedule';
import { coursesToEvents, BASE_SATURDAY, COURSE_COLORS } from '@/utils/calendar';
import { toPersianDigits } from '@/utils/persian';

interface Props {
  hoveredCourse: Course | null;
}

const DAY_HEADER_MAP: Record<string, string> = {
  Sat: 'شنبه',
  Sun: 'یکشنبه',
  Mon: 'دوشنبه',
  Tue: 'سه‌شنبه',
  Wed: 'چهارشنبه',
};

const colorMap = new Map<string, number>();

function getStoredRotation(): boolean {
  try {
    return localStorage.getItem('plan-calendar-rotated') === 'true';
  } catch { return false; }
}

export function WeeklySchedule({ hoveredCourse }: Props) {
  const { selectedCourses, removeCourse } = useSchedule();
  const [rotated, setRotated] = useState(getStoredRotation);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: EventClickArg['event']['extendedProps'] | null;
  }>({ visible: false, x: 0, y: 0, content: null });

  const allCourses = useMemo(() => {
    const courses = [...selectedCourses];
    if (hoveredCourse) {
      const alreadySelected = selectedCourses.some(
        (c) => c.courseCode === hoveredCourse.courseCode && c.group === hoveredCourse.group,
      );
      if (alreadySelected) {
        return courses.map((c) =>
          c.courseCode === hoveredCourse.courseCode && c.group === hoveredCourse.group
            ? { ...c, mode: 'both' as const }
            : c,
        );
      } else {
        courses.push({ ...hoveredCourse, mode: 'hover' });
      }
    }
    return courses;
  }, [selectedCourses, hoveredCourse]);

  const events = useMemo(
    () => coursesToEvents(allCourses, colorMap),
    [allCourses],
  );

  function handleToggleRotation() {
    setRotated((r) => {
      const next = !r;
      localStorage.setItem('plan-calendar-rotated', String(next));
      return next;
    });
  }

  function handleEventClick(info: EventClickArg) {
    const { courseCode, group } = info.event.extendedProps;
    setTooltip((t) => ({ ...t, visible: false }));
    removeCourse(courseCode, group);
  }

  function handleMouseEnter(info: { event: EventClickArg['event']; el: HTMLElement }) {
    const rect = info.el.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left,
      y: rect.bottom + 8,
      content: info.event.extendedProps,
    });
  }

  function handleMouseLeave() {
    setTooltip((t) => ({ ...t, visible: false }));
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 relative transition-colors">
      {/* Rotate toggle — top bar */}
      <div className="flex justify-start mb-2">
        <button
          onClick={handleToggleRotation}
          data-export-exclude
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          title={rotated ? 'نمای عادی' : 'چرخش ۹۰ درجه'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6"/>
            <path d="M21.34 15.57a10 10 0 1 1-.57-8.38"/>
          </svg>
          {rotated ? 'نمای عادی' : 'چرخش ۹۰°'}
        </button>
      </div>

      {rotated ? (
        <TransposedCalendar
          courses={allCourses}
          onRemoveCourse={removeCourse}
        />
      ) : (
        <>
          <FullCalendar
            plugins={[timeGridPlugin]}
            initialView="timeGridWeek"
            initialDate={BASE_SATURDAY}
            locale="fa"
            direction="rtl"
            firstDay={6}
            headerToolbar={false}
            allDaySlot={false}
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            slotDuration="01:00:00"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            dayHeaderFormat={{ weekday: 'short' }}
            dayHeaderContent={(arg) => {
              const dayKey = arg.date.toLocaleDateString('en-US', { weekday: 'short' });
              return DAY_HEADER_MAP[dayKey] ?? dayKey;
            }}
            hiddenDays={[4, 5]}
            events={events}
            eventClick={handleEventClick}
            eventMouseEnter={handleMouseEnter}
            eventMouseLeave={handleMouseLeave}
            eventContent={renderEventContent}
            height="auto"
            expandRows
          />
        </>
      )}

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-sm w-64 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">
            {tooltip.content.courseName}
          </div>
          <div className="text-gray-600 dark:text-gray-300 space-y-0.5">
            <div>استاد: {tooltip.content.professor}</div>
            <div>کد: {toPersianDigits(tooltip.content.courseCode)}-{toPersianDigits(tooltip.content.group)}</div>
            <div>واحد: {toPersianDigits(tooltip.content.unitCount)}</div>
            {tooltip.content.location && <div>محل: {tooltip.content.location}</div>}
            {tooltip.content.prerequisites && <div>{tooltip.content.prerequisites}</div>}
            {tooltip.content.examDate && (
              <div>
                امتحان: {toPersianDigits(tooltip.content.examDate)} - {toPersianDigits(tooltip.content.examTime)}
              </div>
            )}
            {tooltip.content.notes && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{tooltip.content.notes}</div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-400">برای حذف کلیک کنید</div>
        </div>
      )}
    </div>
  );
}

/* ─── Transposed Calendar (days=rows, hours=columns, native RTL) ─── */

const HOVER_COLOR = { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };

const DAYS: { dow: number; label: string }[] = [
  { dow: 6, label: 'شنبه' },
  { dow: 0, label: 'یکشنبه' },
  { dow: 1, label: 'دوشنبه' },
  { dow: 2, label: 'سه‌شنبه' },
  { dow: 3, label: 'چهارشنبه' },
];

const SLOT_START = 7;  // 07:00
const SLOT_END = 20;   // 20:00
const TOTAL_SLOTS = SLOT_END - SLOT_START; // 13 hours

function timeToFraction(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h - SLOT_START + m / 60) / TOTAL_SLOTS;
}

interface TransposedEvent {
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
  startFraction: number; // 0..1 within the hour axis
  widthFraction: number; // 0..1
  color: { bg: string; border: string; text: string };
  isHover: boolean;
}

function buildTransposedEvents(
  courses: SelectedCourse[],
  cMap: Map<string, number>,
): Map<number, TransposedEvent[]> {
  const byDay = new Map<number, TransposedEvent[]>();
  for (const d of DAYS) byDay.set(d.dow, []);

  for (const course of courses) {
    const colorKey = `${course.courseCode}-${course.group}`;
    let colorIndex = cMap.get(colorKey);
    if (colorIndex === undefined) {
      colorIndex = cMap.size % COURSE_COLORS.length;
      cMap.set(colorKey, colorIndex);
    }
    const isHover = course.mode === 'hover';
    const color = isHover ? HOVER_COLOR : COURSE_COLORS[colorIndex];

    for (const session of course.sessions) {
      const start = timeToFraction(session.startTime);
      const end = timeToFraction(session.endTime);
      const evt: TransposedEvent = {
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
        startFraction: start,
        widthFraction: end - start,
        color,
        isHover,
      };
      byDay.get(session.dayOfWeek)?.push(evt);
    }
  }
  return byDay;
}

const transposedColorMap = new Map<string, number>();

function TransposedCalendar({
  courses,
  onRemoveCourse,
}: {
  courses: SelectedCourse[];
  onRemoveCourse: (code: string, group: number) => void;
}) {
  const byDay = useMemo(
    () => buildTransposedEvents(courses, transposedColorMap),
    [courses],
  );

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = SLOT_START; h < SLOT_END; h++) arr.push(h);
    return arr;
  }, []);

  // CSS grid: 1 day-label column + N hour columns
  const gridCols = `70px repeat(${TOTAL_SLOTS}, 1fr)`;

  return (
    <div className="transposed-cal overflow-x-auto" dir="rtl">
      <div className="min-w-[600px]" style={{ display: 'grid', gridTemplateColumns: gridCols }}>
        {/* Header row: empty corner + hour labels */}
        <div className="transposed-cal-corner" />
        {hours.map((h) => (
          <div key={h} className="transposed-cal-hour-header">
            {toPersianDigits(String(h).padStart(2, '0'))}:۰۰
          </div>
        ))}

        {/* Day rows */}
        {DAYS.map(({ dow, label }) => (
          <div key={dow} className="contents">
            {/* Day label */}
            <div className="transposed-cal-day-label">{label}</div>
            {/* Track spanning all hour columns */}
            <div className="transposed-cal-track" style={{ gridColumn: `2 / -1` }}>
              {/* Grid lines */}
              <div className="transposed-cal-grid">
                {hours.map((h) => (
                  <div key={h} className="transposed-cal-gridline" />
                ))}
              </div>
              {/* Events */}
              {byDay.get(dow)?.map((evt, i) => (
                <div
                  key={`${evt.courseCode}-${evt.group}-${i}`}
                  className="transposed-cal-event"
                  style={{
                    right: `${evt.startFraction * 100}%`,
                    width: `${evt.widthFraction * 100}%`,
                    backgroundColor: evt.color.bg,
                    borderColor: evt.color.border,
                    color: evt.color.text,
                    opacity: evt.isHover ? 0.7 : 1,
                  }}
                  onClick={() => !evt.isHover && onRemoveCourse(evt.courseCode, evt.group)}
                  title={`${evt.courseName} — ${evt.professor}`}
                >
                  <span className="transposed-cal-event-name">{evt.courseName}</span>
                  <span className="transposed-cal-event-prof">{evt.professor}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Standard FullCalendar event renderer ─── */

function renderEventContent(eventInfo: EventContentArg) {
  const { courseName, professor } = eventInfo.event.extendedProps;
  return (
    <div className="flex flex-col h-full justify-center text-center leading-tight p-0.5">
      <div className="font-bold text-xs truncate">{courseName}</div>
      <div className="text-[11px] truncate opacity-80">{professor}</div>
    </div>
  );
}
