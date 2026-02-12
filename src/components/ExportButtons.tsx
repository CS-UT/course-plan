import { useSchedule } from '@/hooks/useSchedule';
import html2canvas from 'html2canvas';

export function ExportButtons() {
  const { schedules, currentScheduleId } = useSchedule();

  async function exportAsImage() {
    const el = document.getElementById('schedule-export-area');
    if (!el) return;
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = `schedule-${currentScheduleId + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function exportAsJson() {
    const data = {
      schedules,
      currentScheduleId,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'plan-csut-schedules.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function importFromJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.schedules && Array.isArray(data.schedules)) {
            localStorage.setItem('plan-schedules', JSON.stringify(data.schedules));
            if (typeof data.currentScheduleId === 'number') {
              localStorage.setItem('plan-currentScheduleId', JSON.stringify(data.currentScheduleId));
            }
            window.location.reload();
          }
        } catch {
          alert('فایل نامعتبر است');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={exportAsImage}
        className="text-xs text-gray-500 hover:text-primary-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
        title="ذخیره تصویر برنامه"
      >
        تصویر
      </button>
      <button
        onClick={exportAsJson}
        className="text-xs text-gray-500 hover:text-primary-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
        title="خروجی JSON"
      >
        خروجی
      </button>
      <button
        onClick={importFromJson}
        className="text-xs text-gray-500 hover:text-primary-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
        title="ورودی JSON"
      >
        ورودی
      </button>
    </div>
  );
}
