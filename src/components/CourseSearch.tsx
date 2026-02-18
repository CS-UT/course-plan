import { useState, useMemo } from 'react';
import { useAtom } from 'jotai';
import type { Course } from '@/types';
import { normalizeQuery, tokenizeQuery, matchesAllTokens, toPersianDigits, dayName, WEEK_DAYS_ORDER } from '@/utils/persian';
import { useSchedule } from '@/hooks/useSchedule';
import { findTimeConflicts, findExamConflicts } from '@/utils/conflicts';
import { TutorProfileModal } from './TutorProfileModal';
import { slotFilterAtom } from '@/atoms';
import tutorNameMap from '@/data/tutor-name-map.json';

interface Props {
  courses: Course[];
  onHoverCourse: (course: Course | null) => void;
  onOpenManualEntry: () => void;
}

type CourseTab = 'specialized' | 'general';

interface Filters {
  day: string;
  gender: string;
  department: string;
  courseCode: string;
  hideConflicts: boolean;
}

const defaultFilters: Filters = {
  day: '',
  gender: '',
  department: '',
  courseCode: '',
  hideConflicts: false,
};

function isGeneralCourse(course: Course): boolean {
  // 1120xxx are university-wide general courses, but some (e.g. 1120033
  // معادلات دیفرانسیل) are departmental courses repackaged with a 1120 code.
  // These have equivalents in the 6103 (department) range.
  return course.courseCode.startsWith('1120')
    && !/معادل.*6103\d/.test(course.prerequisites);
}

function getDepartment(course: Course): string {
  if (!isGeneralCourse(course)) return 'ریاضی';
  if (!course.notes) return 'تربیت بدنی';
  const match = course.notes.match(/^([^-/]+?)[\s]*-/);
  if (!match) return 'تربیت بدنی';
  let dept = match[1].trim();
  if (dept === 'روان شناسی') dept = 'روانشناسی';
  if (dept.startsWith('قابل اخذ')) return 'علوم';
  return dept;
}

export function CourseSearch({ courses, onHoverCourse, onOpenManualEntry }: Props) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CourseTab>('specialized');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(activeTab === 'general');
  const [activeTutorId, setActiveTutorId] = useState<string | null>(null);
  const { addCourse, removeCourse, isCourseSelected, selectedCourses } = useSchedule();
  const [slotFilter, setSlotFilter] = useAtom(slotFilterAtom);

  const activeFilterCount = (filters.day ? 1 : 0) + (filters.gender ? 1 : 0) + (filters.department ? 1 : 0) + (filters.courseCode ? 1 : 0) + (filters.hideConflicts ? 1 : 0);

  const tabCourses = useMemo(() => {
    return courses.filter((c) =>
      activeTab === 'general' ? isGeneralCourse(c) : !isGeneralCourse(c),
    );
  }, [courses, activeTab]);

  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    tabCourses.forEach((c) => deptSet.add(getDepartment(c)));
    return [...deptSet].sort((a, b) => a.localeCompare(b, 'fa'));
  }, [tabCourses]);

  const courseTitles = useMemo(() => {
    const map = new Map<string, string>();
    tabCourses.forEach((c) => {
      if (!map.has(c.courseCode)) map.set(c.courseCode, c.courseName);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'fa'));
  }, [tabCourses]);

  const filtered = useMemo(() => {
    let result = tabCourses;

    const q = normalizeQuery(query);
    if (q) {
      const tokens = tokenizeQuery(q);
      result = result.filter(
        (c) =>
          matchesAllTokens(tokens, normalizeQuery(c.courseName)) ||
          matchesAllTokens(tokens, normalizeQuery(c.courseCode)) ||
          matchesAllTokens(tokens, normalizeQuery(c.professor)),
      );
    }

    if (filters.day) {
      const dayNum = Number(filters.day);
      result = result.filter((c) => c.sessions.some((s) => s.dayOfWeek === dayNum));
    }
    if (filters.gender) {
      result = result.filter((c) => c.gender === filters.gender);
    }
    if (filters.department) {
      result = result.filter((c) => getDepartment(c) === filters.department);
    }
    if (filters.courseCode) {
      result = result.filter((c) => c.courseCode === filters.courseCode);
    }
    if (filters.hideConflicts) {
      result = result.filter((c) => {
        if (isCourseSelected(c.courseCode, c.group)) return true;
        return findTimeConflicts(c, selectedCourses).length === 0 && findExamConflicts(c, selectedCourses).length === 0;
      });
    }

    if (slotFilter) {
      result = result.filter((c) =>
        c.sessions.some(
          (s) =>
            s.dayOfWeek === slotFilter.dayOfWeek &&
            s.startTime < slotFilter.endTime &&
            s.endTime > slotFilter.startTime,
        ),
      );
    }

    return result;
  }, [tabCourses, query, filters, selectedCourses, isCourseSelected, slotFilter]);

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
    'px-2 py-1.5 text-xs border border-white/30 dark:border-white/10 rounded-lg backdrop-blur-md bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-400';

  // Reset department filter when switching tabs since departments differ per tab
  function handleTabChange(tab: CourseTab) {
    setActiveTab(tab);
    setFilters((f) => ({ ...f, department: '', courseCode: '' }));
    if (tab === 'general') setShowFilters(true);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tab bar */}
      <div className="flex rounded-xl backdrop-blur-md bg-white/20 dark:bg-white/5 p-1 gap-1 border border-white/20 dark:border-white/10">
        <button
          onClick={() => handleTabChange('specialized')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'specialized'
              ? 'backdrop-blur-xl bg-white/50 dark:bg-white/10 text-primary-700 dark:text-primary-300 shadow-sm shadow-black/5'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          تخصصی
        </button>
        <button
          onClick={() => handleTabChange('general')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'backdrop-blur-xl bg-white/50 dark:bg-white/10 text-primary-700 dark:text-primary-300 shadow-sm shadow-black/5'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          عمومی
        </button>
      </div>

      <input
        type="text"
        placeholder="جستجوی درس، کد یا استاد..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2.5 border border-white/30 dark:border-white/10 rounded-xl backdrop-blur-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white/40 dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
      />

      <button
        onClick={onOpenManualEntry}
        className="w-full px-4 py-2 text-sm font-medium border border-dashed border-white/30 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/10 hover:border-primary-400/50 dark:hover:border-primary-400/30 transition-colors cursor-pointer"
      >
        + افزودن درس دستی
      </button>

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
        <div className="flex flex-col gap-2 p-3 backdrop-blur-md bg-white/20 dark:bg-white/5 rounded-xl border border-white/20 dark:border-white/10">
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
            {activeTab === 'general' && (
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
            )}
            {activeTab === 'general' && (
              <select
                value={filters.department}
                onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
                className={selectClass}
              >
                <option value="">دانشکده</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
            {activeTab === 'general' && (
              <select
                value={filters.courseCode}
                onChange={(e) => setFilters((f) => ({ ...f, courseCode: e.target.value }))}
                className={selectClass}
              >
                <option value="">نام درس</option>
                {courseTitles.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            )}
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

      {slotFilter && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 backdrop-blur-md bg-primary-500/10 dark:bg-primary-400/10 border border-primary-300/30 dark:border-primary-400/20 rounded-lg text-xs text-primary-700 dark:text-primary-300">
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            {dayName(slotFilter.dayOfWeek)} {toPersianDigits(slotFilter.startTime)}-{toPersianDigits(slotFilter.endTime)}
          </span>
          <button
            onClick={() => setSlotFilter(null)}
            className="text-gray-500 dark:text-gray-400 hover:text-danger-600 dark:hover:text-danger-400 cursor-pointer"
            title="پاک کردن فیلتر زمانی"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
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
              onOpenTutor={setActiveTutorId}
            />
          );
        })}
      </div>

      <TutorProfileModal
        open={activeTutorId !== null}
        onClose={() => setActiveTutorId(null)}
        tutorId={activeTutorId}
      />
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
  onOpenTutor,
}: {
  course: Course;
  selected: boolean;
  hasConflict: boolean;
  timeConflicts: Course[];
  examConflicts: Course[];
  onToggle: () => void;
  onHover: () => void;
  onLeave: () => void;
  onOpenTutor: (tutorId: string) => void;
}) {
  const genderLabel = course.gender === 'male' ? 'پسران' : course.gender === 'female' ? 'دختران' : '';
  const tutorId = (tutorNameMap as Record<string, string>)[course.professor] ?? null;

  return (
    <div
      className={`p-3 rounded-xl border text-sm transition-all cursor-pointer ${
        selected
          ? 'backdrop-blur-xl bg-primary-500/10 dark:bg-primary-400/10 border-primary-300/40 dark:border-primary-400/20 ring-1 ring-primary-300/30 dark:ring-primary-400/20 shadow-lg shadow-primary-500/10'
          : hasConflict
            ? 'backdrop-blur-xl bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-warning-50/50 dark:hover:bg-warning-600/10 hover:border-warning-300/40 dark:hover:border-warning-500/30'
            : 'backdrop-blur-xl bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 hover:border-white/30 dark:hover:border-white/15'
      }`}
      onClick={onToggle}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 dark:text-gray-100 truncate">{course.courseName}</div>
          <div className="text-xs mt-1">
            {tutorId ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTutor(tutorId);
                }}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline decoration-dotted cursor-pointer"
              >
                {course.professor}
              </button>
            ) : (
              <span className="text-gray-600 dark:text-gray-400">{course.professor}</span>
            )}
          </div>
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
          <span key={i} className="bg-white/25 dark:bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {dayName(s.dayOfWeek)} {toPersianDigits(s.startTime)}-{toPersianDigits(s.endTime)}
          </span>
        ))}
        {genderLabel && (
          <span className="bg-white/25 dark:bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-sm">{genderLabel}</span>
        )}
      </div>

      {course.examDate && (
        <div className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          امتحان: {toPersianDigits(course.examDate)} ساعت {toPersianDigits(course.examTime)}
        </div>
      )}

      {course.prerequisites && (
        <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {course.prerequisites}
        </div>
      )}

      {course.notes && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded px-2 py-1.5 leading-relaxed">
          {course.notes}
        </div>
      )}

      {hasConflict && !selected && (
        <div className="mt-2 text-xs text-warning-600 bg-warning-50/60 dark:bg-warning-600/10 rounded backdrop-blur-sm px-2 py-1">
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
