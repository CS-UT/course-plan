import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

type MajorKey = 'cs' | 'math' | 'statistics';

interface MajorInfo {
  key: MajorKey;
  label: string;
  description: string;
  imageUrl: string;
  telegramUrl: string;
  color: string;
  darkColor: string;
  bgColor: string;
  darkBgColor: string;
  icon: string;
}

const majors: MajorInfo[] = [
  {
    key: 'cs',
    label: 'علوم کامپیوتر',
    description: 'چارت دروس کارشناسی علوم کامپیوتر — ورودی ۱۴۰۰ به بعد',
    imageUrl: '/roadmaps/cs.jpg',
    telegramUrl: 'https://t.me/UT_MSCS/599',
    color: 'text-emerald-700',
    darkColor: 'dark:text-emerald-400',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-950/40',
    icon: '💻',
  },
  {
    key: 'math',
    label: 'ریاضیات و کاربردها',
    description: 'چارت دروس کارشناسی ریاضیات و کاربردها — ورودی ۱۴۰۰ به بعد',
    imageUrl: '/roadmaps/math.jpg',
    telegramUrl: 'https://t.me/UT_MSCS/684',
    color: 'text-blue-700',
    darkColor: 'dark:text-blue-400',
    bgColor: 'bg-blue-50',
    darkBgColor: 'dark:bg-blue-950/40',
    icon: '📐',
  },
  {
    key: 'statistics',
    label: 'آمار',
    description: 'چارت دروس کارشناسی رشته آمار — ورودی ۱۴۰۰ به بعد',
    imageUrl: '/roadmaps/statistics.jpg',
    telegramUrl: 'https://t.me/UT_MSCS/685',
    color: 'text-purple-700',
    darkColor: 'dark:text-purple-400',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-950/40',
    icon: '📊',
  },
];

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('plan-dark-mode');
      if (saved !== null) return saved === 'true';
    } catch { /* ignore */ }
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('plan-dark-mode', String(dark)); } catch { /* ignore */ }
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

/* ── Zoomable / pannable image viewer ── */
function ImageViewer({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.min(Math.max(s + delta, 0.5), 5));
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({ x: posStart.current.x + dx, y: posStart.current.y + dy });
  }

  function handlePointerUp() {
    setIsDragging(false);
  }

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        <button
          onClick={() => setScale((s) => Math.min(s + 0.3, 5))}
          className="w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-lg font-bold shadow-sm backdrop-blur-sm"
          title="بزرگ‌نمایی"
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(s - 0.3, 0.5))}
          className="w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-lg font-bold shadow-sm backdrop-blur-sm"
          title="کوچک‌نمایی"
        >
          −
        </button>
        {scale !== 1 && (
          <button
            onClick={resetView}
            className="h-8 px-2.5 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-xs font-medium shadow-sm backdrop-blur-sm"
            title="بازنشانی"
          >
            بازنشانی
          </button>
        )}
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 select-none"
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => { if (scale <= 1) setScale(2.5); }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="w-full transition-transform duration-150"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center center',
            imageRendering: scale > 2 ? 'pixelated' : 'auto',
          }}
        />
      </div>
    </div>
  );
}

/* ── Legend section explaining color coding ── */
function ColorLegend() {
  const items = [
    { color: 'bg-yellow-400', label: 'دروس عمومی' },
    { color: 'bg-blue-400', label: 'دروس پایه' },
    { color: 'bg-green-400', label: 'دروس اصلی / تخصصی' },
    { color: 'bg-red-400', label: 'دروس اختیاری' },
    { color: 'bg-purple-400', label: 'پیش‌نیاز' },
  ];

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">راهنمای رنگ‌ها:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-sm ${item.color}`} />
          <span className="text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function RoadmapPage() {
  const [selectedMajor, setSelectedMajor] = useState<MajorKey>('cs');
  const [dark, toggleDark] = useDarkMode();
  const currentMajor = majors.find((m) => m.key === selectedMajor)!;

  useEffect(() => {
    document.title = 'چارت دروس — دانشکده ریاضی، آمار و علوم کامپیوتر';
    return () => { document.title = 'برنامه‌ریزی انتخاب واحد'; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              برنامه‌ریزی انتخاب واحد
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <h1 className="text-sm font-medium text-gray-700 dark:text-gray-200">
              چارت دروس
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/CS-UT/course-plan"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              title="GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-600 dark:text-gray-300"
              title={dark ? 'حالت روشن' : 'حالت تاریک'}
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Page title */}
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
            چارت دروس کارشناسی
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            دانشکده ریاضی، آمار و علوم کامپیوتر — دانشگاه تهران
          </p>
        </div>

        {/* Major selection cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {majors.map((major) => {
            const isSelected = selectedMajor === major.key;
            return (
              <button
                key={major.key}
                onClick={() => setSelectedMajor(major.key)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all cursor-pointer text-right
                  ${isSelected
                    ? `${major.bgColor} ${major.darkBgColor} border-current ${major.color} ${major.darkColor} shadow-sm`
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{major.icon}</span>
                  <div>
                    <div className={`font-bold text-sm ${isSelected ? '' : ''}`}>{major.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">کارشناسی — ورودی ۱۴۰۰+</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 left-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected major info */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className={`text-lg font-bold ${currentMajor.color} ${currentMajor.darkColor}`}>
                {currentMajor.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {currentMajor.description}
              </p>
            </div>
            <a
              href={currentMajor.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors text-sm font-medium shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              دریافت فایل اصلی (PDF)
            </a>
          </div>

          {/* Image viewer */}
          <ImageViewer src={currentMajor.imageUrl} alt={`چارت دروس ${currentMajor.label}`} />

          {/* Color legend */}
          <ColorLegend />

          {/* Source attribution */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              منبع: کانال تلگرام{' '}
              <a
                href="https://t.me/UT_MSCS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 dark:text-primary-400 hover:underline"
              >
                @UT_MSCS
              </a>
              {' '}— دانشکده ریاضی، آمار و علوم کامپیوتر
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              برای مشاهده نسخه با کیفیت بالا، فایل PDF را از لینک تلگرام دریافت کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
