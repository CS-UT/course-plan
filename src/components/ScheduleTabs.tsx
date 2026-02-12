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
                ? 'bg-white text-primary-700 border border-b-0 border-gray-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
        className="px-3 py-1.5 text-sm text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        title="برنامه جدید"
      >
        +
      </button>

      <button
        onClick={duplicateSchedule}
        className="px-3 py-1.5 text-xs text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        title="کپی برنامه فعلی"
      >
        کپی
      </button>
    </div>
  );
}
