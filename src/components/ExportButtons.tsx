import { useState } from 'react';
import { useSchedule } from '@/hooks/useSchedule';
import { toJpeg, toPng } from 'html-to-image';
import { downloadICS } from '@/utils/googleCalendar';

export function ExportButtons() {
  const { currentScheduleId, selectedCourses } = useSchedule();
  const [busy, setBusy] = useState(false);

  function getExportElement() {
    return document.getElementById('schedule-export-area');
  }

  function exportFilter(node: Node) {
    if (node instanceof HTMLElement && node.dataset.exportExclude !== undefined) return false;
    return true;
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
        filter: exportFilter,
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
        const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', filter: exportFilter });
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
        const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', filter: exportFilter });
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
        filter: exportFilter,
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

  function addToGoogleCalendar() {
    if (selectedCourses.length === 0) {
      alert('ابتدا درس‌هایی را به برنامه اضافه کنید.');
      return;
    }
    downloadICS(selectedCourses);
  }

  const btnClass =
    'text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait whitespace-nowrap';

  const calendarBtnClass =
    'flex items-center gap-1.5 text-xs font-medium text-white bg-gradient-to-l from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap';

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={shareImage} className={btnClass} disabled={busy} title="اشتراک‌گذاری تصویر برنامه">
        اشتراک‌گذاری
      </button>
      <button onClick={downloadImage} className={btnClass} disabled={busy} title="دانلود تصویر برنامه">
        {busy ? '...' : 'دانلود تصویر'}
      </button>
      <button onClick={addToGoogleCalendar} className={calendarBtnClass} title="افزودن برنامه به تقویم گوگل">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
        اضافه شدن به تقویم گوگل
      </button>
    </div>
  );
}
