import { useState } from 'react';
import { useSchedule } from '@/hooks/useSchedule';
import html2canvas from 'html2canvas';

export function ExportButtons() {
  const { currentScheduleId } = useSchedule();
  const [busy, setBusy] = useState(false);

  async function captureSchedule(): Promise<Blob | null> {
    const el = document.getElementById('schedule-export-area');
    if (!el) return null;

    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.92,
        );
      });
    } catch (err) {
      console.error('Failed to capture schedule:', err);
      return null;
    }
  }

  async function downloadImage() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await captureSchedule();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule-${currentScheduleId + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function shareImage() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await captureSchedule();
      if (!blob) return;

      const file = new File([blob], `schedule-${currentScheduleId + 1}.jpg`, {
        type: 'image/jpeg',
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'برنامه هفتگی',
        });
      } else {
        // Fallback: copy to clipboard as PNG
        try {
          const pngBlob = await new Promise<Blob | null>((resolve) => {
            const el = document.getElementById('schedule-export-area');
            if (!el) { resolve(null); return; }
            html2canvas(el, {
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              logging: false,
              allowTaint: true,
            }).then((canvas) => {
              canvas.toBlob((b) => resolve(b), 'image/png');
            });
          });
          if (pngBlob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': pngBlob }),
            ]);
            return;
          }
        } catch {
          // ignore clipboard errors
        }
        // Final fallback: download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `schedule-${currentScheduleId + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
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
