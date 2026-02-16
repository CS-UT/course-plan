import { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import type { Course, SelectedCourse } from '@/types';
import { useSchedule } from '@/hooks/useSchedule';
import { coursesToEvents, BASE_SATURDAY, COURSE_COLORS } from '@/utils/calendar';
import { toPersianDigits } from '@/utils/persian';

interface Props {
  hoveredCourse: Course | null;
  onEditCourse: (course: Course) => void;
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

export function WeeklySchedule({ hoveredCourse, onEditCourse }: Props) {
  const { selectedCourses, removeCourse } = useSchedule();
  const [rotated, setRotated] = useState(getStoredRotation);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: EventClickArg['event']['extendedProps'] | null;
  }>({ visible: false, x: 0, y: 0, content: null });
  const tooltipHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile: tapped course for action sheet
  const [tappedCourse, setTappedCourse] = useState<SelectedCourse | null>(null);

  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

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
    const props = info.event.extendedProps;
    const course = selectedCourses.find(
      (c) => c.courseCode === props.courseCode && c.group === props.group,
    );
    if (!course) return;
    setTooltip((t) => ({ ...t, visible: false }));
    if (isTouchDevice) {
      setTappedCourse(course);
    } else {
      onEditCourse(course);
    }
  }

  function handleMouseEnter(info: { event: EventClickArg['event']; el: HTMLElement }) {
    if (tooltipHideTimeout.current) {
      clearTimeout(tooltipHideTimeout.current);
      tooltipHideTimeout.current = null;
    }
    const rect = info.el.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left,
      y: rect.bottom + 4,
      content: info.event.extendedProps,
    });
  }

  function handleMouseLeave() {
    tooltipHideTimeout.current = setTimeout(() => {
      setTooltip((t) => ({ ...t, visible: false }));
    }, 150);
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
          {rotated ? 'نمای عادی' : 'چرخش ۹۰ درجه'}
        </button>
      </div>

      {rotated ? (
        <TransposedCalendar
          courses={allCourses}
          onRemoveCourse={removeCourse}
          onEditCourse={onEditCourse}
          isTouchDevice={isTouchDevice}
          onTapCourse={setTappedCourse}
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
            slotEventOverlap={false}
            events={events}
            eventClick={handleEventClick}
            eventMouseEnter={handleMouseEnter}
            eventMouseLeave={handleMouseLeave}
            eventContent={renderEventContent}
            eventClassNames={(arg) =>
              arg.event.extendedProps.hasConflict ? ['fc-event--conflict'] : []
            }
            height="auto"
            expandRows
          />
        </>
      )}

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-sm w-64"
          style={{ left: tooltip.x, top: tooltip.y }}
          onMouseEnter={() => {
            if (tooltipHideTimeout.current) {
              clearTimeout(tooltipHideTimeout.current);
              tooltipHideTimeout.current = null;
            }
          }}
          onMouseLeave={() => {
            tooltipHideTimeout.current = setTimeout(() => {
              setTooltip((t) => ({ ...t, visible: false }));
            }, 150);
          }}
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
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                const course = selectedCourses.find(
                  (c) => c.courseCode === tooltip.content!.courseCode && c.group === tooltip.content!.group,
                );
                if (course) {
                  setTooltip((t) => ({ ...t, visible: false }));
                  onEditCourse(course);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              ویرایش
            </button>
            <button
              onClick={() => {
                const { courseCode, group } = tooltip.content!;
                setTooltip((t) => ({ ...t, visible: false }));
                removeCourse(courseCode, group);
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 hover:bg-danger-100 dark:hover:bg-danger-500/20 rounded-lg transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              حذف
            </button>
          </div>
        </div>
      )}

      {/* Mobile action sheet */}
      {tappedCourse && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setTappedCourse(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-5 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

            {/* Course info */}
            <div className="mb-4">
              <div className="font-bold text-base text-gray-900 dark:text-gray-100">
                {tappedCourse.courseName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 space-y-0.5">
                {tappedCourse.professor && <div>استاد: {tappedCourse.professor}</div>}
                <div>کد: {toPersianDigits(tappedCourse.courseCode)}-{toPersianDigits(tappedCourse.group)}</div>
                <div>واحد: {toPersianDigits(tappedCourse.unitCount)}</div>
                {tappedCourse.examDate && (
                  <div>
                    امتحان: {toPersianDigits(tappedCourse.examDate)} - {toPersianDigits(tappedCourse.examTime)}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const course = tappedCourse;
                  setTappedCourse(null);
                  onEditCourse(course);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-xl transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ویرایش درس
              </button>
              <button
                onClick={() => {
                  removeCourse(tappedCourse.courseCode, tappedCourse.group);
                  setTappedCourse(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 hover:bg-danger-100 dark:hover:bg-danger-500/20 rounded-xl transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                حذف درس
              </button>
              <button
                onClick={() => setTappedCourse(null)}
                className="w-full px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
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
  endFraction: number;   // 0..1
  widthFraction: number; // 0..1
  color: { bg: string; border: string; text: string };
  isHover: boolean;
  hasConflict: boolean;
  // Layout fields set after overlap detection
  lane: number;
  totalLanes: number;
}

function eventsOverlap(a: TransposedEvent, b: TransposedEvent): boolean {
  return a.startFraction < b.endFraction && b.startFraction < a.endFraction;
}

function assignLanes(events: TransposedEvent[]): void {
  // Sort by start time
  const sorted = [...events].sort((a, b) => a.startFraction - b.startFraction);

  // Assign lanes using a greedy algorithm
  for (const evt of sorted) {
    // Find overlapping events already assigned lanes
    const overlapping = sorted.filter(
      (other) => other !== evt && other.lane >= 0 && eventsOverlap(evt, other),
    );
    // Find the first available lane
    const usedLanes = new Set(overlapping.map((o) => o.lane));
    let lane = 0;
    while (usedLanes.has(lane)) lane++;
    evt.lane = lane;
  }

  // For each group of overlapping events, set totalLanes
  for (const evt of sorted) {
    // Find all events in the same overlap cluster
    const cluster: TransposedEvent[] = [evt];
    const visited = new Set<TransposedEvent>([evt]);
    const queue = [evt];
    while (queue.length > 0) {
      const current = queue.pop()!;
      for (const other of sorted) {
        if (!visited.has(other) && eventsOverlap(current, other)) {
          visited.add(other);
          cluster.push(other);
          queue.push(other);
        }
      }
    }
    const maxLane = Math.max(...cluster.map((e) => e.lane));
    for (const e of cluster) {
      e.totalLanes = Math.max(e.totalLanes, maxLane + 1);
      e.hasConflict = cluster.length > 1;
    }
  }
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
        endFraction: end,
        widthFraction: end - start,
        color,
        isHover,
        hasConflict: false,
        lane: -1,
        totalLanes: 1,
      };
      byDay.get(session.dayOfWeek)?.push(evt);
    }
  }

  // Assign lanes for each day
  for (const events of byDay.values()) {
    assignLanes(events);
  }

  return byDay;
}

const transposedColorMap = new Map<string, number>();

function TransposedCalendar({
  courses,
  onRemoveCourse,
  onEditCourse,
  isTouchDevice,
  onTapCourse,
}: {
  courses: SelectedCourse[];
  onRemoveCourse: (code: string, group: number) => void;
  onEditCourse: (course: Course) => void;
  isTouchDevice: boolean;
  onTapCourse: (course: SelectedCourse) => void;
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
        {DAYS.map(({ dow, label }) => {
          const dayEvents = byDay.get(dow) ?? [];
          const maxLanes = dayEvents.length > 0
            ? Math.max(...dayEvents.map((e) => e.totalLanes))
            : 1;
          const trackHeight = maxLanes > 1 ? maxLanes * 36 : undefined;
          return (
          <div key={dow} className="contents">
            {/* Day label */}
            <div className="transposed-cal-day-label">{label}</div>
            {/* Track spanning all hour columns */}
            <div className="transposed-cal-track" style={{ gridColumn: `2 / -1`, ...(trackHeight ? { height: trackHeight } : {}) }}>
              {/* Grid lines */}
              <div className="transposed-cal-grid">
                {hours.map((h) => (
                  <div key={h} className="transposed-cal-gridline" />
                ))}
              </div>
              {/* Events */}
              {byDay.get(dow)?.map((evt, i) => {
                const laneHeight = 100 / evt.totalLanes;
                const topPct = evt.lane * laneHeight;
                return (
                  <div
                    key={`${evt.courseCode}-${evt.group}-${i}`}
                    className={`transposed-cal-event group/evt${evt.hasConflict ? ' transposed-cal-event--conflict' : ''}`}
                    style={{
                      right: `${evt.startFraction * 100}%`,
                      width: `${evt.widthFraction * 100}%`,
                      top: evt.totalLanes > 1 ? `${topPct}%` : '3px',
                      bottom: evt.totalLanes > 1 ? undefined : '3px',
                      height: evt.totalLanes > 1 ? `calc(${laneHeight}% - 2px)` : undefined,
                      backgroundColor: evt.color.bg,
                      borderColor: evt.color.border,
                      color: evt.color.text,
                      opacity: evt.isHover ? 0.7 : 1,
                    }}
                    onClick={() => {
                      if (evt.isHover) return;
                      const course = courses.find(
                        (c) => c.courseCode === evt.courseCode && c.group === evt.group,
                      );
                      if (!course) return;
                      if (isTouchDevice) {
                        onTapCourse(course);
                      } else {
                        onEditCourse(course);
                      }
                    }}
                    title={`${evt.courseName} — ${evt.professor}`}
                  >
                    {evt.hasConflict && (
                      <span className="conflict-badge" title="تداخل زمانی">⚠</span>
                    )}
                    <span className="transposed-cal-event-name">{evt.courseName}</span>
                    <span className="transposed-cal-event-prof">{evt.professor}</span>
                    {/* Desktop-only hover overlay with edit/delete */}
                    {!evt.isHover && !isTouchDevice && (
                      <div className="absolute inset-0 bg-black/0 group-hover/evt:bg-black/40 transition-colors rounded flex items-center justify-center gap-1 opacity-0 group-hover/evt:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const course = courses.find(
                              (c) => c.courseCode === evt.courseCode && c.group === evt.group,
                            );
                            if (course) onEditCourse(course);
                          }}
                          className="p-1 bg-white/90 dark:bg-gray-800/90 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          title="ویرایش"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 dark:text-primary-400"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveCourse(evt.courseCode, evt.group);
                          }}
                          className="p-1 bg-white/90 dark:bg-gray-800/90 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-danger-600 dark:text-danger-400"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Standard FullCalendar event renderer ─── */

function renderEventContent(eventInfo: EventContentArg) {
  const { courseName, professor, hasConflict } = eventInfo.event.extendedProps;
  return (
    <div className="flex flex-col h-full justify-center text-center leading-tight p-0.5 relative group/fc">
      {hasConflict && (
        <span className="conflict-badge" title="تداخل زمانی">⚠</span>
      )}
      <div className="font-bold text-xs truncate">{courseName}</div>
      <div className="text-[11px] truncate opacity-80">{professor}</div>
    </div>
  );
}
