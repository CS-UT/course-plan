import { useState } from 'react';
import type { Course } from '@/types';
import { dayName, WEEK_DAYS_ORDER } from '@/utils/persian';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (course: Course) => void;
}

interface SessionInput {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 19; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 19) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

const emptySession = (): SessionInput => ({
  dayOfWeek: '6',
  startTime: '08:00',
  endTime: '10:00',
});

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-transparent';

const selectClass =
  'px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-400';

export function ManualCourseModal({ open, onClose, onSubmit }: Props) {
  const [courseName, setCourseName] = useState('');
  const [professor, setProfessor] = useState('');
  const [unitCount, setUnitCount] = useState('3');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [sessions, setSessions] = useState<SessionInput[]>([emptySession()]);
  const [error, setError] = useState('');

  if (!open) return null;

  function updateSession(index: number, field: keyof SessionInput, value: string) {
    setSessions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function addSession() {
    if (sessions.length >= 2) return;
    setSessions((prev) => [...prev, emptySession()]);
  }

  function removeSession(index: number) {
    if (sessions.length <= 1) return;
    setSessions((prev) => prev.filter((_, i) => i !== index));
  }

  function resetAndClose() {
    setCourseName('');
    setProfessor('');
    setUnitCount('3');
    setExamDate('');
    setExamTime('');
    setSessions([emptySession()]);
    setError('');
    onClose();
  }

  function handleSubmit() {
    if (!courseName.trim()) {
      setError('نام درس الزامی است');
      return;
    }
    const units = parseInt(unitCount);
    if (!units || units < 1) {
      setError('تعداد واحد الزامی است');
      return;
    }
    for (const s of sessions) {
      if (!s.startTime || !s.endTime) {
        setError('ساعت جلسات را وارد کنید');
        return;
      }
      if (s.startTime >= s.endTime) {
        setError('ساعت شروع باید قبل از ساعت پایان باشد');
        return;
      }
    }

    const course: Course = {
      courseCode: `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      group: 1,
      courseName: courseName.trim(),
      unitCount: units,
      gender: 'mixed',
      professor: professor.trim(),
      sessions: sessions.map((s) => ({
        dayOfWeek: Number(s.dayOfWeek),
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      examDate: examDate.trim(),
      examTime: examTime.trim(),
      location: '',
      prerequisites: '',
      notes: '',
      grade: '',
    };

    onSubmit(course);
    resetAndClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={resetAndClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">افزودن درس دستی</h2>
          <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl cursor-pointer">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Course name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام درس *</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className={inputClass}
              placeholder="مثلا: ریاضی عمومی ۱"
            />
          </div>

          {/* Units */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تعداد واحد *</label>
            <input
              type="number"
              min={1}
              max={6}
              value={unitCount}
              onChange={(e) => setUnitCount(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Sessions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">جلسات *</label>
            <div className="flex flex-col gap-2">
              {sessions.map((session, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={session.dayOfWeek}
                    onChange={(e) => updateSession(i, 'dayOfWeek', e.target.value)}
                    className={selectClass + ' flex-shrink-0'}
                  >
                    {WEEK_DAYS_ORDER.map((d) => (
                      <option key={d} value={d}>{dayName(d)}</option>
                    ))}
                  </select>
                  <select
                    value={session.startTime}
                    onChange={(e) => updateSession(i, 'startTime', e.target.value)}
                    className={selectClass}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-gray-400 text-sm">تا</span>
                  <select
                    value={session.endTime}
                    onChange={(e) => updateSession(i, 'endTime', e.target.value)}
                    className={selectClass}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {sessions.length > 1 && (
                    <button
                      onClick={() => removeSession(i)}
                      className="text-gray-400 hover:text-danger-500 cursor-pointer text-lg"
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
            {sessions.length < 2 && (
              <button
                onClick={addSession}
                className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium cursor-pointer"
              >
                + افزودن جلسه دوم
              </button>
            )}
          </div>

          {/* Professor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام استاد (اختیاری)</label>
            <input
              type="text"
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Exam date + time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ امتحان (اختیاری)</label>
              <input
                type="text"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className={inputClass}
                placeholder="۱۴۰۵/۰۴/۲۰"
                dir="ltr"
              />
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ساعت</label>
              <select
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
            بدون تاریخ امتحان، تداخل امتحان بررسی نمی‌شود
          </p>

          {/* Error */}
          {error && (
            <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors cursor-pointer"
          >
            افزودن به برنامه
          </button>
        </div>
      </div>
    </div>
  );
}
