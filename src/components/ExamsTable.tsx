import { useMemo } from 'react';
import type { Course } from '@/types';
import { useSchedule } from '@/hooks/useSchedule';
import { toPersianDigits } from '@/utils/persian';
import { hasExamConflict } from '@/utils/conflicts';

interface Props {
  onEditCourse: (course: Course) => void;
}

export function ExamsTable({ onEditCourse }: Props) {
  const { selectedCourses, removeCourse, totalUnits } = useSchedule();

  const sorted = useMemo(() => {
    return [...selectedCourses].sort((a, b) => {
      if (a.examDate !== b.examDate) return a.examDate.localeCompare(b.examDate);
      return a.examTime.localeCompare(b.examTime);
    });
  }, [selectedCourses]);

  const conflictingPairs = useMemo(() => {
    const pairs = new Set<string>();
    for (let i = 0; i < selectedCourses.length; i++) {
      for (let j = i + 1; j < selectedCourses.length; j++) {
        if (hasExamConflict(selectedCourses[i], selectedCourses[j])) {
          pairs.add(`${selectedCourses[i].courseCode}-${selectedCourses[i].group}`);
          pairs.add(`${selectedCourses[j].courseCode}-${selectedCourses[j].group}`);
        }
      }
    }
    return pairs;
  }, [selectedCourses]);

  if (selectedCourses.length === 0) {
    return (
      <div className="mt-3 text-sm text-gray-400 dark:text-gray-500 text-center py-6">
        هنوز درسی انتخاب نشده
      </div>
    );
  }

  return (
    <div className="mt-3 bg-white/80 dark:bg-gray-900/50 rounded-2xl border border-purple-200/30 dark:border-purple-500/15 overflow-hidden transition-colors shadow-lg shadow-purple-500/5">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-violet-50/50 to-pink-50/50 dark:from-violet-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300">
            <tr>
              <th className="px-3 py-2 text-right font-medium">کد</th>
              <th className="px-3 py-2 text-right font-medium">نام درس</th>
              <th className="px-3 py-2 text-right font-medium">گروه</th>
              <th className="px-3 py-2 text-right font-medium">واحد</th>
              <th className="px-3 py-2 text-right font-medium">استاد</th>
              <th className="px-3 py-2 text-right font-medium">زمان امتحان</th>
              <th className="px-3 py-2 text-center font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100/30 dark:divide-purple-500/10">
            {sorted.map((course) => {
              const key = `${course.courseCode}-${course.group}`;
              const hasConflict = conflictingPairs.has(key);
              return (
                <tr
                  key={key}
                  className={hasConflict ? 'bg-pink-50/50 dark:bg-pink-500/10' : 'hover:bg-purple-50/30 dark:hover:bg-purple-900/10'}
                >
                  <td className="px-3 py-2 tabular-nums">{toPersianDigits(course.courseCode)}</td>
                  <td className="px-3 py-2 font-medium">{course.courseName}</td>
                  <td className="px-3 py-2">{toPersianDigits(course.group)}</td>
                  <td className="px-3 py-2">{toPersianDigits(course.unitCount)}</td>
                  <td className="px-3 py-2">{course.professor}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {course.examDate
                      ? `${toPersianDigits(course.examDate)} - ${toPersianDigits(course.examTime)}`
                      : '—'}
                    {hasConflict && (
                      <span className="mr-2 text-danger-600 dark:text-danger-400 text-xs font-medium">⚠ تداخل</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEditCourse(course)}
                        className="text-gray-400 hover:text-primary-500 transition-colors cursor-pointer"
                        title="ویرایش"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => removeCourse(course.courseCode, course.group)}
                        className="text-gray-400 hover:text-danger-500 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gradient-to-r from-violet-50/50 to-pink-50/50 dark:from-violet-900/20 dark:to-pink-900/20 font-medium">
            <tr>
              <td className="px-3 py-2" colSpan={3}>جمع</td>
              <td className="px-3 py-2">{toPersianDigits(totalUnits)}</td>
              <td className="px-3 py-2" colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden divide-y divide-purple-100/30 dark:divide-purple-500/10">
        {sorted.map((course) => {
          const key = `${course.courseCode}-${course.group}`;
          const hasConflict = conflictingPairs.has(key);
          return (
            <div
              key={key}
              className={`p-3 text-sm ${hasConflict ? 'bg-pink-50/50 dark:bg-pink-500/10' : ''}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{course.courseName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {course.professor} · گروه {toPersianDigits(course.group)} · {toPersianDigits(course.unitCount)} واحد
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditCourse(course)}
                    className="text-gray-400 hover:text-primary-500 transition-colors cursor-pointer p-1 -m-1"
                    title="ویرایش"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    onClick={() => removeCourse(course.courseCode, course.group)}
                    className="text-gray-400 hover:text-danger-500 transition-colors cursor-pointer p-1 -m-1"
                    title="حذف"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {course.examDate && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 tabular-nums">
                  امتحان: {toPersianDigits(course.examDate)} - {toPersianDigits(course.examTime)}
                  {hasConflict && (
                    <span className="mr-2 text-danger-600 dark:text-danger-400 font-medium">⚠ تداخل</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div className="p-3 bg-gradient-to-r from-violet-50/50 to-pink-50/50 dark:from-violet-900/20 dark:to-pink-900/20 text-sm font-medium flex justify-between">
          <span>جمع</span>
          <span>{toPersianDigits(totalUnits)} واحد</span>
        </div>
      </div>
    </div>
  );
}
