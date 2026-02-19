import { useSchedule } from '@/hooks/useSchedule';
import { toPersianDigits } from '@/utils/persian';

export function ScheduleTabs() {
  const {
    schedules,
    currentScheduleId,
    setCurrentScheduleId,
    createSchedule,
    deleteSchedule,
    duplicateSchedule,
  } = useSchedule();

  return (
    <div data-tour="schedule-tabs" className="flex items-center gap-2 flex-wrap">
      {schedules.map((s) => (
        <div key={s.id} className="flex items-center">
          <button
            onClick={() => setCurrentScheduleId(s.id)}
            className={`px-4 py-1.5 text-sm rounded-t-lg font-medium transition-colors cursor-pointer ${
              s.id === currentScheduleId
                ? 'bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-300 border border-b-0 border-gray-200 dark:border-gray-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            برنامه {toPersianDigits(s.id + 1)}
          </button>
          {s.id === currentScheduleId && schedules.length > 1 && (
            <button
              onClick={() => deleteSchedule(s.id)}
              className="text-gray-400 hover:text-danger-500 text-xs mr-1 cursor-pointer"
              title="حذف"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <button
        onClick={createSchedule}
        className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
        title="برنامه جدید"
      >
        +
      </button>

      <button
        onClick={duplicateSchedule}
        className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
        title="کپی برنامه فعلی"
      >
        کپی
      </button>
    </div>
  );
}
