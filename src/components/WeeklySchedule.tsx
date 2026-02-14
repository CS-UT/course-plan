import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import type { Course } from '@/types';
import { useSchedule } from '@/hooks/useSchedule';
import { coursesToEvents, BASE_SATURDAY } from '@/utils/calendar';
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rotatorRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);
  // Track rotation in a ref to avoid re-rendering FullCalendar
  const isRotated = useRef(getStoredRotation());

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

  // Apply/remove rotation via direct DOM manipulation to avoid triggering
  // a React re-render of FullCalendar (which would recalculate event sizes
  // using post-transform dimensions from getBoundingClientRect).
  const applyRotation = useCallback((rotated: boolean) => {
    const wrapper = wrapperRef.current;
    const rotator = rotatorRef.current;
    const cal = calRef.current;
    if (!wrapper || !rotator || !cal) return;

    if (rotated) {
      const w = cal.offsetWidth;
      wrapper.style.height = `${w}px`;
      rotator.style.setProperty('--cal-w', `${w}px`);
      rotator.classList.add('calendar-rotated');
    } else {
      wrapper.style.height = '';
      rotator.classList.remove('calendar-rotated');
      rotator.style.removeProperty('--cal-w');
    }
  }, []);

  // Apply initial rotation after FullCalendar has rendered
  useEffect(() => {
    // Wait for FullCalendar to fully render before applying rotation
    const timer = setTimeout(() => applyRotation(isRotated.current), 150);
    return () => clearTimeout(timer);
  }, [applyRotation]);

  // Re-apply rotation when events change (FullCalendar might re-render)
  useEffect(() => {
    if (isRotated.current) {
      // Small delay to let FullCalendar finish its update
      const timer = setTimeout(() => applyRotation(true), 150);
      return () => clearTimeout(timer);
    }
  }, [events, applyRotation]);

  function handleToggleRotation() {
    isRotated.current = !isRotated.current;
    localStorage.setItem('plan-calendar-rotated', String(isRotated.current));
    applyRotation(isRotated.current);
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
      {/* Rotate toggle */}
      <button
        onClick={handleToggleRotation}
        className="absolute top-2 left-2 z-10 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-500 dark:text-gray-400"
        title={isRotated.current ? 'نمای عادی' : 'چرخش ۹۰ درجه'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6"/>
          <path d="M21.34 15.57a10 10 0 1 1-.57-8.38"/>
        </svg>
      </button>

      {/* Outer wrapper — reserves visual height when rotated */}
      <div ref={wrapperRef} className="overflow-hidden">
        {/* Rotator — carries the CSS transform */}
        <div ref={rotatorRef}>
          {/* Stable container — FullCalendar lives here, never changes size */}
          <div ref={calRef}>
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
              hiddenDays={[4, 5]} // Hide Thursday & Friday
              events={events}
              eventClick={handleEventClick}
              eventMouseEnter={handleMouseEnter}
              eventMouseLeave={handleMouseLeave}
              eventContent={renderEventContent}
              height="auto"
              expandRows
            />
          </div>
        </div>
      </div>

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

function renderEventContent(eventInfo: EventContentArg) {
  const { courseName, professor } = eventInfo.event.extendedProps;
  return (
    <div className="flex flex-col h-full justify-center text-center leading-tight p-0.5">
      <div className="font-bold text-xs truncate">{courseName}</div>
      <div className="text-[11px] truncate opacity-80">{professor}</div>
    </div>
  );
}
