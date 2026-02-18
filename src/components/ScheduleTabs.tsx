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
            className={`px-4 py-1.5 text-sm rounded-t-xl font-semibold transition-colors cursor-pointer ${
              s.id === currentScheduleId
                ? 'bg-[#FFF8F0] dark:bg-[#2A2420] text-primary-700 dark:text-primary-300 border border-b-0 border-[#E8DED2] dark:border-[#3D352E]'
                : 'bg-[#F0E6D8] dark:bg-[#3D352E] text-[#8B7355] dark:text-[#9C8B7A] hover:bg-[#E8DED2] dark:hover:bg-[#4A403A]'
            }`}
          >
            برنامه {toPersianDigits(s.id + 1)}
          </button>
          {s.id === currentScheduleId && schedules.length > 1 && (
            <button
              onClick={() => deleteSchedule(s.id)}
              className="text-[#B8A898] hover:text-danger-500 text-xs mr-1 cursor-pointer"
              title="حذف"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <button
        onClick={createSchedule}
        className="px-3 py-1.5 text-sm text-[#8B7355] dark:text-[#9C8B7A] hover:text-primary-600 dark:hover:text-primary-400 hover:bg-[#F0E6D8] dark:hover:bg-[#3D352E] rounded-xl transition-colors cursor-pointer"
        title="برنامه جدید"
      >
        +
      </button>

      <button
        onClick={duplicateSchedule}
        className="px-3 py-1.5 text-xs text-[#8B7355] dark:text-[#9C8B7A] hover:text-primary-600 dark:hover:text-primary-400 hover:bg-[#F0E6D8] dark:hover:bg-[#3D352E] rounded-xl transition-colors cursor-pointer"
        title="کپی برنامه فعلی"
      >
        کپی
      </button>
    </div>
  );
}
