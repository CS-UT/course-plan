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
                ? 'bg-[#FFD700] dark:bg-[#854d0e] text-black dark:text-yellow-100 border-2 border-b-0 border-black dark:border-white shadow-[2px_-2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_-2px_0px_0px_rgba(255,255,255,0.25)] font-extrabold'
                : 'bg-white dark:bg-[#2a2a2a] text-black dark:text-gray-300 border-2 border-b-0 border-black dark:border-white hover:bg-[#FFD700]/30 dark:hover:bg-[#854d0e]/30 font-bold'
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
        className="px-3 py-1.5 text-sm text-black dark:text-white hover:text-black hover:bg-[#FFD700] border-2 border-black dark:border-white rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.25)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold transition-colors cursor-pointer"
        title="برنامه جدید"
      >
        +
      </button>

      <button
        onClick={duplicateSchedule}
        className="px-3 py-1.5 text-xs text-black dark:text-white hover:text-black hover:bg-[#FFD700] border-2 border-black dark:border-white rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.25)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold transition-colors cursor-pointer"
        title="کپی برنامه فعلی"
      >
        کپی
      </button>
    </div>
  );
}
