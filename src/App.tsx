import { useState } from 'react';
import coursesData from '@/data/courses.json';
import type { CoursesData, Course } from '@/types';
import { CourseSearch } from '@/components/CourseSearch';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { ScheduleTabs } from '@/components/ScheduleTabs';
import { ExamsTable } from '@/components/ExamsTable';
import { ExportButtons } from '@/components/ExportButtons';
import { useSchedule } from '@/hooks/useSchedule';
import { toPersianDigits } from '@/utils/persian';

const data = coursesData as CoursesData;

function App() {
  const schedule = useSchedule();
  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);
  const [showExams, setShowExams] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-primary-800">
              plan.csut.ir
            </h1>
            <span className="text-sm text-gray-500 hidden sm:inline">
              {data.semesterLabel} — {data.department}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium bg-primary-100 text-primary-800 px-3 py-1 rounded-full">
              {toPersianDigits(schedule.totalUnits)} واحد
            </span>
            <ExportButtons />
          </div>
        </div>
      </header>

      {/* Schedule Tabs */}
      <div className="max-w-[1600px] mx-auto px-4 pt-3">
        <ScheduleTabs />
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-4 flex gap-4">
        {/* Sidebar - Course Search */}
        <aside className="w-80 shrink-0 hidden lg:block">
          <CourseSearch
            courses={data.courses}
            onHoverCourse={setHoveredCourse}
          />
        </aside>

        {/* Main - Schedule Grid */}
        <main className="flex-1 min-w-0">
          <div id="schedule-export-area">
            <WeeklySchedule hoveredCourse={hoveredCourse} />
          </div>

          {/* Exam toggle */}
          <div className="mt-4">
            <button
              onClick={() => setShowExams((v) => !v)}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors cursor-pointer"
            >
              {showExams ? 'پنهان کردن جدول امتحانات' : 'نمایش جدول امتحانات'}
            </button>
            {showExams && <ExamsTable />}
          </div>
        </main>
      </div>

      {/* Mobile course search - bottom sheet */}
      <MobileCourseSearch courses={data.courses} onHoverCourse={setHoveredCourse} />
    </div>
  );
}

function MobileCourseSearch({ courses, onHoverCourse }: { courses: Course[]; onHoverCourse: (c: Course | null) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 bg-primary-600 text-white px-4 py-3 rounded-full shadow-lg z-50 font-medium cursor-pointer"
      >
        + افزودن درس
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg">انتخاب درس</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 text-xl cursor-pointer">✕</button>
            </div>
            <CourseSearch courses={courses} onHoverCourse={onHoverCourse} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
