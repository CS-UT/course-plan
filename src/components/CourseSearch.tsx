import { useState, useMemo } from 'react';
import type { Course } from '@/types';
import { normalizeQuery, toPersianDigits, dayName, WEEK_DAYS_ORDER } from '@/utils/persian';
import { useSchedule } from '@/hooks/useSchedule';
import { findTimeConflicts, findExamConflicts } from '@/utils/conflicts';

interface Props {
  courses: Course[];
  onHoverCourse: (course: Course | null) => void;
}

interface Filters {
  day: string;
  gender: string;
  hideConflicts: boolean;
}

const defaultFilters: Filters = {
  day: '',
  gender: '',
  hideConflicts: false,
};

export function CourseSearch({ courses, onHoverCourse }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const { addCourse, removeCourse, isCourseSelected, selectedCourses } = useSchedule();

  const activeFilterCount = (filters.day ? 1 : 0) + (filters.gender ? 1 : 0) + (filters.hideConflicts ? 1 : 0);

  const filtered = useMemo(() => {
    let result = courses;

    const q = normalizeQuery(query);
    if (q) {
      result = result.filter(
        (c) =>
          normalizeQuery(c.courseName).includes(q) ||
          normalizeQuery(c.courseCode).includes(q) ||
          normalizeQuery(c.professor).includes(q),
      );
    }

    if (filters.day) {
      const dayNum = Number(filters.day);
      result = result.filter((c) => c.sessions.some((s) => s.dayOfWeek === dayNum));
    }
    if (filters.gender) {
      result = result.filter((c) => c.gender === filters.gender);
    }
    if (filters.hideConflicts) {
      result = result.filter((c) => {
        if (isCourseSelected(c.courseCode, c.group)) return true;
        return findTimeConflicts(c, selectedCourses).length === 0 && findExamConflicts(c, selectedCourses).length === 0;
      });
    }

    return result;
  }, [courses, query, filters, selectedCourses, isCourseSelected]);

  function handleToggle(course: Course) {
    if (isCourseSelected(course.courseCode, course.group)) {
      removeCourse(course.courseCode, course.group);
      onHoverCourse(null);
    } else {
      addCourse(course);
    }
  }

  function clearFilters() {
    setFilters(defaultFilters);
  }

  const selectClass =
    'px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-400';

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="جستجوی درس، کد یا استاد..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
      />

      <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>{toPersianDigits(filtered.length)} درس</span>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium cursor-pointer flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          فیلتر
          {activeFilterCount > 0 && (
            <span className="bg-primary-600 text-white text-[10px] w-4 h-4 rounded-full inline-flex items-center justify-center">
              {toPersianDigits(activeFilterCount)}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.day}
              onChange={(e) => setFilters((f) => ({ ...f, day: e.target.value }))}
              className={selectClass}
            >
              <option value="">روز هفته</option>
              {WEEK_DAYS_ORDER.map((d) => (
                <option key={d} value={d}>{dayName(d)}</option>
              ))}
            </select>
            <select
              value={filters.gender}
              onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
              className={selectClass}
            >
              <option value="">جنسیت</option>
              <option value="male">پسران</option>
              <option value="female">دختران</option>
              <option value="mixed">مختلط</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hideConflicts}
              onChange={(e) => setFilters((f) => ({ ...f, hideConflicts: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-400"
            />
            فقط دروس بدون تداخل
          </label>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium cursor-pointer self-start"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      )}

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
  const genderLabel = course.gender === 'male' ? 'پسران' : course.gender === 'female' ? 'دختران' : '';

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
