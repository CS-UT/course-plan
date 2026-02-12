import { useState, useMemo } from 'react';
import type { Course } from '@/types';
import { normalizeQuery, toPersianDigits, dayName } from '@/utils/persian';
import { useSchedule } from '@/hooks/useSchedule';
import { findTimeConflicts, findExamConflicts } from '@/utils/conflicts';

interface Props {
  courses: Course[];
  onHoverCourse: (course: Course | null) => void;
}

export function CourseSearch({ courses, onHoverCourse }: Props) {
  const [query, setQuery] = useState('');
  const { addCourse, removeCourse, isCourseSelected, selectedCourses } = useSchedule();

  const filtered = useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return courses;
    return courses.filter(
      (c) =>
        normalizeQuery(c.courseName).includes(q) ||
        normalizeQuery(c.courseCode).includes(q) ||
        normalizeQuery(c.professor).includes(q),
    );
  }, [courses, query]);

  function handleToggle(course: Course) {
    if (isCourseSelected(course.courseCode, course.group)) {
      removeCourse(course.courseCode, course.group);
      onHoverCourse(null);
    } else {
      addCourse(course);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="جستجوی درس، کد یا استاد..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
      />

      <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>{toPersianDigits(filtered.length)} درس</span>
      </div>

      <div className="flex flex-col gap-2 max-h-[calc(100vh-220px)] overflow-y-auto">
        {filtered.map((course) => {
          const selected = isCourseSelected(course.courseCode, course.group);
          const timeConflicts = selected ? [] : findTimeConflicts(course, selectedCourses);
          const examConflicts = selected ? [] : findExamConflicts(course, selectedCourses);
          const hasConflict = timeConflicts.length > 0 || examConflicts.length > 0;

          return (
            <CourseCard
              key={`${course.courseCode}-${course.group}`}
              course={course}
              selected={selected}
              hasConflict={hasConflict}
              timeConflicts={timeConflicts}
              examConflicts={examConflicts}
              onToggle={() => handleToggle(course)}
              onHover={() => onHoverCourse(course)}
              onLeave={() => onHoverCourse(null)}
            />
          );
        })}
      </div>
    </div>
  );
}

function CourseCard({
  course,
  selected,
  hasConflict,
  timeConflicts,
  examConflicts,
  onToggle,
  onHover,
  onLeave,
}: {
  course: Course;
  selected: boolean;
  hasConflict: boolean;
  timeConflicts: Course[];
  examConflicts: Course[];
  onToggle: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const genderLabel = course.gender === 'male' ? 'مرد' : course.gender === 'female' ? 'زن' : '';

  return (
    <div
      className={`p-3 rounded-xl border text-sm transition-all cursor-pointer ${
        selected
          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 ring-1 ring-primary-200 dark:ring-primary-800'
          : hasConflict
            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-warning-50 dark:hover:bg-warning-600/10 hover:border-warning-300 dark:hover:border-warning-600'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onToggle}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 dark:text-gray-100 truncate">{course.courseName}</div>
          <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">{course.professor}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {toPersianDigits(course.courseCode)}-{toPersianDigits(course.group)}
          </span>
          <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
            {toPersianDigits(course.unitCount)} واحد
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        {course.sessions.map((s, i) => (
          <span key={i} className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
            {dayName(s.dayOfWeek)} {toPersianDigits(s.startTime)}-{toPersianDigits(s.endTime)}
          </span>
        ))}
        {genderLabel && (
          <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{genderLabel}</span>
        )}
      </div>

      {course.examDate && (
        <div className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          امتحان: {toPersianDigits(course.examDate)} ساعت {toPersianDigits(course.examTime)}
        </div>
      )}

      {hasConflict && !selected && (
        <div className="mt-2 text-xs text-warning-600 bg-warning-50 dark:bg-warning-600/10 rounded px-2 py-1">
          {timeConflicts.length > 0 && (
            <div>تداخل زمانی با: {timeConflicts.map((c) => c.courseName).join('، ')}</div>
          )}
          {examConflicts.length > 0 && (
            <div>تداخل امتحان با: {examConflicts.map((c) => c.courseName).join('، ')}</div>
          )}
        </div>
      )}

      {selected && (
        <div className="mt-2 text-xs text-primary-600 dark:text-primary-400 font-medium">
          ✓ انتخاب شده
        </div>
      )}
    </div>
  );
}
