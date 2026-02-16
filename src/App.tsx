import { useState, useEffect } from 'react';
import coursesData from '@/data/courses.json';
import type { CoursesData, Course } from '@/types';
import { CourseSearch } from '@/components/CourseSearch';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { ScheduleTabs } from '@/components/ScheduleTabs';
import { ExamsTable } from '@/components/ExamsTable';
import { ExportButtons } from '@/components/ExportButtons';
import { ManualCourseModal } from '@/components/ManualCourseModal';
import { useSchedule } from '@/hooks/useSchedule';
import { toPersianDigits } from '@/utils/persian';

const data = coursesData as CoursesData;

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('plan-dark-mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('plan-dark-mode', String(dark));
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

function MobileBanner() {
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem('plan-mobile-banner-dismissed') === 'true',
  );

  if (dismissed) return null;

  return (
    <div className="lg:hidden bg-primary-50 dark:bg-primary-900/30 border-b border-primary-200 dark:border-primary-800 px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-xs text-primary-800 dark:text-primary-200">
        برای تجربه بهتر و مشاهده کامل برنامه هفتگی، از نسخه دسکتاپ استفاده کنید.
      </p>
      <button
        onClick={() => {
          setDismissed(true);
          sessionStorage.setItem('plan-mobile-banner-dismissed', 'true');
        }}
        className="text-primary-600 dark:text-primary-400 text-xs shrink-0 cursor-pointer font-medium"
      >
        متوجه شدم
      </button>
    </div>
  );
}

function App() {
  const schedule = useSchedule();
  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);
  const [showExams, setShowExams] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [dark, toggleDark] = useDarkMode();

  function handleEditCourse(course: Course) {
    setEditingCourse(course);
    setShowManualEntry(true);
  }

  function handleEditSubmit(updatedCourse: Course) {
    if (editingCourse) {
      schedule.updateCourse(editingCourse.courseCode, editingCourse.group, updatedCourse);
      setEditingCourse(null);
    } else {
      schedule.addCourse(updatedCourse);
    }
  }

  function handleModalClose() {
    setShowManualEntry(false);
    setEditingCourse(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline truncate">
            {data.semesterLabel} — {data.department}
          </span>
          <div className="flex items-center gap-2 sm:gap-3 mr-auto sm:mr-0">
            <span className="text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full whitespace-nowrap">
              {toPersianDigits(schedule.totalUnits)} واحد
            </span>
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
            <div className="hidden sm:block">
              <ExportButtons />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile banner */}
      <MobileBanner />

      {/* Schedule Tabs & Mobile Export */}
      <div className="max-w-[1600px] mx-auto px-4 pt-3 space-y-2 sm:space-y-0">
        <div className="flex items-center justify-between">
          <ScheduleTabs />
        </div>
        <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto">
          <ExportButtons />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-4 pb-20 lg:pb-4 flex gap-4">
        {/* Sidebar - Course Search */}
        <aside className="w-80 shrink-0 hidden lg:block">
          <CourseSearch
            courses={data.courses}
            onHoverCourse={setHoveredCourse}
            onOpenManualEntry={() => setShowManualEntry(true)}
          />
        </aside>

        {/* Main - Schedule Grid */}
        <main className="flex-1 min-w-0">
          {/* Horizontally scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
            <div id="schedule-export-area" className="min-w-[640px]">
              <WeeklySchedule hoveredCourse={hoveredCourse} onEditCourse={handleEditCourse} />
            </div>
          </div>

          {/* Exams table */}
          <div className="mt-4">
            <button
              onClick={() => setShowExams((v) => !v)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium transition-colors cursor-pointer"
            >
              {showExams ? 'پنهان کردن جدول امتحانات' : 'نمایش جدول امتحانات'}
            </button>
            {showExams && <ExamsTable onEditCourse={handleEditCourse} />}
          </div>
        </main>
      </div>

      {/* Mobile course search - bottom sheet */}
      <MobileCourseSearch courses={data.courses} onHoverCourse={setHoveredCourse} onOpenManualEntry={() => setShowManualEntry(true)} />

      {/* Manual course entry modal */}
      <ManualCourseModal
        open={showManualEntry}
        onClose={handleModalClose}
        onSubmit={handleEditSubmit}
        editingCourse={editingCourse}
      />
    </div>
  );
}

function MobileCourseSearch({ courses, onHoverCourse, onOpenManualEntry }: { courses: Course[]; onHoverCourse: (c: Course | null) => void; onOpenManualEntry: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-4 bg-primary-600 text-white px-5 py-3.5 rounded-full shadow-lg z-50 font-medium cursor-pointer text-sm"
      >
        + افزودن درس
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl max-h-[85vh] overflow-y-auto pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 pt-3 pb-2 px-4 z-10 rounded-t-2xl">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">انتخاب درس</h3>
                <button onClick={() => setOpen(false)} className="text-gray-400 dark:text-gray-500 p-1.5 -m-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className="px-4">
              <CourseSearch courses={courses} onHoverCourse={onHoverCourse} onOpenManualEntry={onOpenManualEntry} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
