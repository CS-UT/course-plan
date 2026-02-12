import { useMemo, useState } from 'react';
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

export function WeeklySchedule({ hoveredCourse }: Props) {
  const { selectedCourses, removeCourse } = useSchedule();
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
            {tooltip.content.prerequisites && <div>پیش‌نیاز: {tooltip.content.prerequisites}</div>}
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
  const { courseName, professor, courseCode, group } = eventInfo.event.extendedProps;
  return (
    <div className="flex flex-col h-full justify-center text-center leading-tight p-0.5">
      <div className="font-bold text-[11px] truncate">{courseName}</div>
      <div className="text-[10px] truncate opacity-80">{professor}</div>
      <div className="text-[9px] truncate opacity-60">
        {toPersianDigits(courseCode)}-{toPersianDigits(group)}
      </div>
    </div>
  );
}
