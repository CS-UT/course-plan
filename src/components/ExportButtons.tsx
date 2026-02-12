import { useSchedule } from '@/hooks/useSchedule';
import html2canvas from 'html2canvas';

export function ExportButtons() {
  const { currentScheduleId } = useSchedule();

  async function getScheduleCanvas() {
    const el = document.getElementById('schedule-export-area');
    if (!el) return null;
    return html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
  }

  async function downloadImage() {
    const canvas = await getScheduleCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `schedule-${currentScheduleId + 1}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
  }

  async function shareImage() {
    const canvas = await getScheduleCanvas();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `schedule-${currentScheduleId + 1}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'برنامه هفتگی - plan.csut.ir' });
        } catch {
          // User cancelled share
        }
      } else {
        // Fallback: copy image to clipboard
        try {
          const pngBlob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), 'image/png'),
          );
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': pngBlob }),
          ]);
        } catch {
          // Fallback: just download
          downloadImage();
        }
      }
    }, 'image/jpeg', 0.92);
  }

  const btnClass = "text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer";

  return (
    <div className="flex items-center gap-1">
      <button onClick={downloadImage} className={btnClass} title="دانلود تصویر برنامه">
        دانلود تصویر
      </button>
      <button onClick={shareImage} className={btnClass} title="اشتراک‌گذاری تصویر برنامه">
        اشتراک‌گذاری
      </button>
    </div>
  );
}
