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
      <div className="mt-3 text-sm text-[#3a3a5a] dark:text-[#4a4a6a] text-center py-6">
        هنوز درسی انتخاب نشده
      </div>
    );
  }

  return (
    <div className="mt-3 bg-[#0d0d18] dark:bg-[#12122a] rounded-xl border border-[#1a1a2e] dark:border-[#2a2a4e] overflow-hidden transition-colors">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a14] dark:bg-gray-700 text-[#6a6a8a] dark:text-[#a0a0c0]">
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
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sorted.map((course) => {
              const key = `${course.courseCode}-${course.group}`;
              const hasConflict = conflictingPairs.has(key);
              return (
                <tr
                  key={key}
                  className={hasConflict ? 'bg-danger-50 dark:bg-danger-500/10' : 'hover:bg-[#0a0a14] dark:hover:bg-gray-700/50'}
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
                      <span className="mr-2 text-[#ff0055] dark:text-[#ff4081] text-xs font-medium">⚠ تداخل</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEditCourse(course)}
                        className="text-[#3a3a5a] hover:text-[#00f5ff] transition-colors cursor-pointer"
                        title="ویرایش"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => removeCourse(course.courseCode, course.group)}
                        className="text-[#3a3a5a] hover:text-[#ff0055] transition-colors cursor-pointer"
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
          <tfoot className="bg-[#0a0a14] dark:bg-gray-700 font-medium">
            <tr>
              <td className="px-3 py-2" colSpan={3}>جمع</td>
              <td className="px-3 py-2">{toPersianDigits(totalUnits)}</td>
              <td className="px-3 py-2" colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
        {sorted.map((course) => {
          const key = `${course.courseCode}-${course.group}`;
          const hasConflict = conflictingPairs.has(key);
          return (
            <div
              key={key}
              className={`p-3 text-sm ${hasConflict ? 'bg-danger-50 dark:bg-danger-500/10' : ''}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-[#e0e0e8] dark:text-[#f0f0f8]">{course.courseName}</div>
                  <div className="text-xs text-[#4a4a6a] dark:text-[#6a6a8a] mt-0.5">
                    {course.professor} · گروه {toPersianDigits(course.group)} · {toPersianDigits(course.unitCount)} واحد
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditCourse(course)}
                    className="text-[#3a3a5a] hover:text-[#00f5ff] transition-colors cursor-pointer p-1 -m-1"
                    title="ویرایش"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    onClick={() => removeCourse(course.courseCode, course.group)}
                    className="text-[#3a3a5a] hover:text-[#ff0055] transition-colors cursor-pointer p-1 -m-1"
                    title="حذف"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {course.examDate && (
                <div className="text-xs text-[#4a4a6a] dark:text-[#6a6a8a] mt-1.5 tabular-nums">
                  امتحان: {toPersianDigits(course.examDate)} - {toPersianDigits(course.examTime)}
                  {hasConflict && (
                    <span className="mr-2 text-[#ff0055] dark:text-[#ff4081] font-medium">⚠ تداخل</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div className="p-3 bg-[#0a0a14] dark:bg-gray-700 text-sm font-medium flex justify-between">
          <span>جمع</span>
          <span>{toPersianDigits(totalUnits)} واحد</span>
        </div>
      </div>
    </div>
  );
}
