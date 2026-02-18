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
                ? 'bg-white/80 dark:bg-gray-900/50 text-purple-700 dark:text-purple-300 border border-b-0 border-purple-200/50 dark:border-purple-500/20 shadow-sm shadow-purple-500/5'
                : 'bg-purple-50/30 dark:bg-purple-900/10 text-purple-500 dark:text-purple-400 hover:bg-purple-100/50 dark:hover:bg-purple-900/20'
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
        className="px-3 py-1.5 text-sm text-purple-400 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-500/10 rounded-xl transition-colors cursor-pointer"
        title="برنامه جدید"
      >
        +
      </button>

      <button
        onClick={duplicateSchedule}
        className="px-3 py-1.5 text-xs text-purple-400 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-500/10 rounded-xl transition-colors cursor-pointer"
        title="کپی برنامه فعلی"
      >
        کپی
      </button>
    </div>
  );
}
