import { useState } from 'react';
import { useSchedule } from '@/hooks/useSchedule';
import { toJpeg, toPng } from 'html-to-image';

export function ExportButtons() {
  const { currentScheduleId } = useSchedule();
  const [busy, setBusy] = useState(false);

  function getExportElement() {
    return document.getElementById('schedule-export-area');
  }

  async function downloadImage() {
    if (busy) return;
    const el = getExportElement();
    if (!el) return;

    setBusy(true);
    try {
      const dataUrl = await toJpeg(el, {
        quality: 0.92,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `schedule-${currentScheduleId + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to capture schedule:', err);
      alert('خطا در ذخیره تصویر. لطفا دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  }

  async function shareImage() {
    if (busy) return;
    const el = getExportElement();
    if (!el) return;

    setBusy(true);
    try {
      // Try Web Share API first (mobile)
      if (navigator.share) {
        const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff' });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `schedule-${currentScheduleId + 1}.png`, {
          type: 'image/png',
        });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'برنامه هفتگی' });
          return;
        }
      }

      // Fallback: copy to clipboard
      try {
        const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff' });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        alert('تصویر در کلیپبورد کپی شد.');
        return;
      } catch {
        // clipboard failed, fall through to download
      }

      // Final fallback: download
      const dataUrl = await toJpeg(el, {
        quality: 0.92,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `schedule-${currentScheduleId + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // User cancelled share dialog
    } finally {
      setBusy(false);
    }
  }

  const btnClass =
    'text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait';

  return (
    <div className="flex items-center gap-1">
      <button onClick={downloadImage} className={btnClass} disabled={busy} title="دانلود تصویر برنامه">
        {busy ? '...' : 'دانلود تصویر'}
      </button>
      <button onClick={shareImage} className={btnClass} disabled={busy} title="اشتراک‌گذاری تصویر برنامه">
        اشتراک‌گذاری
      </button>
    </div>
  );
}
