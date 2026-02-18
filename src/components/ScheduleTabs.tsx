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
    <div className="flex items-center gap-2 flex-wrap">
      {schedules.map((s) => (
        <div key={s.id} className="flex items-center">
          <button
            onClick={() => setCurrentScheduleId(s.id)}
            className={`px-4 py-1.5 text-sm rounded-t-lg font-medium transition-colors cursor-pointer ${
              s.id === currentScheduleId
                ? 'backdrop-blur-xl bg-white/50 dark:bg-white/10 text-primary-700 dark:text-primary-300 border border-b-0 border-white/30 dark:border-white/15 shadow-sm'
                : 'backdrop-blur-md bg-white/20 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-white/35 dark:hover:bg-white/10'
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
        className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/30 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        title="برنامه جدید"
      >
        +
      </button>

      <button
        onClick={duplicateSchedule}
        className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/30 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        title="کپی برنامه فعلی"
      >
        کپی
      </button>
    </div>
  );
}
