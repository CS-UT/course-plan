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
                ? 'bg-[#0d0d18] dark:bg-[#12122a] text-[#00f5ff] dark:text-[#67e8f9] border border-b-0 border-[#1a1a2e] dark:border-[#2a2a4e]'
                : 'bg-[#12121f] dark:bg-[#1a1a2e] text-[#6a6a8a] dark:text-[#8a8aaa] hover:bg-[#1a1a2e] dark:hover:bg-gray-600'
            }`}
          >
            برنامه {toPersianDigits(s.id + 1)}
          </button>
          {s.id === currentScheduleId && schedules.length > 1 && (
            <button
              onClick={() => deleteSchedule(s.id)}
              className="text-[#3a3a5a] hover:text-[#ff0055] text-xs mr-1 cursor-pointer"
              title="حذف"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <button
        onClick={createSchedule}
        className="px-3 py-1.5 text-sm text-[#4a4a6a] dark:text-[#6a6a8a] hover:text-[#00f5ff] dark:hover:text-[#00f5ff] hover:bg-[#12121f] dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
        title="برنامه جدید"
      >
        +
      </button>

      <button
        onClick={duplicateSchedule}
        className="px-3 py-1.5 text-xs text-[#4a4a6a] dark:text-[#6a6a8a] hover:text-[#00f5ff] dark:hover:text-[#00f5ff] hover:bg-[#12121f] dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
        title="کپی برنامه فعلی"
      >
        کپی
      </button>
    </div>
  );
}
