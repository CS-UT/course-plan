import { useMemo } from 'react';
import { useSchedule } from '@/hooks/useSchedule';
import { toPersianDigits } from '@/utils/persian';
import { hasExamConflict } from '@/utils/conflicts';

export function ExamsTable() {
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
    <div className="mt-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-3 py-2 text-right font-medium">کد</th>
              <th className="px-3 py-2 text-right font-medium">نام درس</th>
              <th className="px-3 py-2 text-right font-medium">گروه</th>
              <th className="px-3 py-2 text-right font-medium">واحد</th>
              <th className="px-3 py-2 text-right font-medium">استاد</th>
              <th className="px-3 py-2 text-right font-medium">زمان امتحان</th>
              <th className="px-3 py-2 text-center font-medium">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sorted.map((course) => {
              const key = `${course.courseCode}-${course.group}`;
              const hasConflict = conflictingPairs.has(key);
              return (
                <tr
                  key={key}
                  className={hasConflict ? 'bg-danger-50 dark:bg-danger-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}
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
                    <button
                      onClick={() => removeCourse(course.courseCode, course.group)}
                      className="text-gray-400 hover:text-danger-500 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-700 font-medium">
            <tr>
              <td className="px-3 py-2" colSpan={3}>جمع</td>
              <td className="px-3 py-2">{toPersianDigits(totalUnits)}</td>
              <td className="px-3 py-2" colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
