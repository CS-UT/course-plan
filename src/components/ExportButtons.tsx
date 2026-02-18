import { useRef, useState } from 'react';
import { useSchedule } from '@/hooks/useSchedule';
import { toJpeg, toPng } from 'html-to-image';
import { downloadICS } from '@/utils/googleCalendar';
import coursesData from '@/data/courses.json';
import type { CoursesData } from '@/types';
import { toPersianDigits } from '@/utils/persian';

const allCourses = (coursesData as CoursesData).courses;

export function ExportButtons() {
  const { currentScheduleId, selectedCourses, importCourses } = useSchedule();
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        backgroundColor: '#FFF8F0',
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
        const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#FFF8F0', filter: exportFilter });
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
        const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#FFF8F0', filter: exportFilter });
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
        backgroundColor: '#FFF8F0',
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

  function exportSchedule() {
    const courses = selectedCourses
      .filter((c) => c.mode !== 'hover')
      .map((c) => ({ courseCode: c.courseCode, group: c.group }));
    if (courses.length === 0) {
      alert('ابتدا درس‌هایی را به برنامه اضافه کنید.');
      return;
    }
    const json = JSON.stringify({ courses }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule-${currentScheduleId + 1}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be selected again
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.courses || !Array.isArray(data.courses)) {
          alert('فرمت فایل نامعتبر است.');
          return;
        }

        const coursesToImport = [];
        const notFound: string[] = [];

        for (const entry of data.courses) {
          if (typeof entry.courseCode !== 'string' || typeof entry.group !== 'number') {
            alert('فرمت فایل نامعتبر است.');
            return;
          }
          const found = allCourses.find(
            (c) => c.courseCode === entry.courseCode && c.group === entry.group,
          );
          if (found) {
            coursesToImport.push(found);
          } else {
            notFound.push(`${entry.courseCode}-${entry.group}`);
          }
        }

        if (coursesToImport.length === 0 && notFound.length === 0) {
          alert('فایل خالی است.');
          return;
        }

        const { added, skipped } = importCourses(coursesToImport);

        const parts: string[] = [];
        if (added > 0) parts.push(`${toPersianDigits(added)} درس اضافه شد`);
        if (skipped > 0) parts.push(`${toPersianDigits(skipped)} درس تکراری رد شد`);
        if (notFound.length > 0) parts.push(`${toPersianDigits(notFound.length)} درس در کاتالوگ یافت نشد`);
        alert(parts.join('\n'));
      } catch {
        alert('خطا در خواندن فایل. لطفا یک فایل JSON معتبر انتخاب کنید.');
      }
    };
    reader.readAsText(file);
  }

  const btnClass =
    'text-xs text-[#8B7355] dark:text-[#9C8B7A] hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 rounded-xl hover:bg-[#F0E6D8] dark:hover:bg-[#3D352E] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait whitespace-nowrap';

  const calendarBtnClass =
    'flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-l from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 dark:from-primary-600 dark:to-primary-700 dark:hover:from-primary-500 dark:hover:to-primary-600 px-3 py-1.5 rounded-xl shadow-sm shadow-amber-900/10 hover:shadow transition-all cursor-pointer whitespace-nowrap';

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
      <button onClick={exportSchedule} className={`${btnClass} flex items-center gap-1`} title="اکسپورت برنامه به فایل JSON">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        اکسپورت
      </button>
      <button onClick={() => fileInputRef.current?.click()} className={`${btnClass} flex items-center gap-1`} title="ایمپورت برنامه از فایل JSON">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        ایمپورت
      </button>
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
