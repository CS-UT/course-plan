import { useState, useRef, useEffect } from 'react';

const GITHUB_ISSUE_URL =
  'https://github.com/CS-UT/course-plan/issues/new?labels=feedback&title=&body=%23%23%20%D8%A8%D8%A7%D8%B2%D8%AE%D9%88%D8%B1%D8%AF%0A%0A';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-600 dark:text-gray-300"
        title="بازخورد"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 z-50">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            نظر، پیشنهاد یا مشکلی دارید؟
          </p>
          <a
            href={GITHUB_ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ثبت بازخورد در گیت‌هاب
          </a>
        </div>
      )}
    </div>
  );
}
