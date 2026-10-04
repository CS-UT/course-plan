import type { Course } from '@/types';
import { toPersianDigits } from '@/utils/persian';

interface Props {
  course: Pick<Course, 'location' | 'prerequisites' | 'notes'>;
}

export function CourseDetails({ course }: Props) {
  const details = [
    { label: 'محل برگزاری', value: course.location?.trim() ?? '' },
    { label: 'پیش‌نیاز و معادل', value: course.prerequisites?.trim() ?? '' },
    { label: 'توضیحات', value: course.notes?.trim() ?? '' },
  ].filter((detail) => detail.value);

  if (details.length === 0) return null;

  return (
    <dl className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-3 text-sm">
      {details.map(({ label, value }) => (
        <div key={label}>
          <dt className="font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</dt>
          <dd className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words leading-relaxed">
            {toPersianDigits(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
