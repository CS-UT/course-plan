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
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
}

const HOURS = Array.from({ length: 14 }, (_, i) => String(i + 6).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const emptySession = (): SessionInput => ({
  dayOfWeek: '6',
  startHour: '08',
  startMinute: '00',
  endHour: '10',
  endMinute: '00',
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
  const [examTimeHour, setExamTimeHour] = useState('');
  const [examTimeMinute, setExamTimeMinute] = useState('00');
  const [sessions, setSessions] = useState<SessionInput[]>([emptySession()]);
  const [error, setError] = useState('');

  if (!open) return null;

  function updateSession(index: number, field: keyof SessionInput, value: string) {
    setSessions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function addSession() {
    if (sessions.length >= 7) return;
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
    setExamTimeHour('');
    setExamTimeMinute('00');
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
      const startTime = `${s.startHour}:${s.startMinute}`;
      const endTime = `${s.endHour}:${s.endMinute}`;
      if (startTime >= endTime) {
        setError('ساعت شروع باید قبل از ساعت پایان باشد');
        return;
      }
    }

    const examTime = examTimeHour ? `${examTimeHour}:${examTimeMinute}` : '';

    const course: Course = {
      courseCode: `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      group: 1,
      courseName: courseName.trim(),
      unitCount: units,
      gender: 'mixed',
      professor: professor.trim(),
      sessions: sessions.map((s) => ({
        dayOfWeek: Number(s.dayOfWeek),
        startTime: `${s.startHour}:${s.startMinute}`,
        endTime: `${s.endHour}:${s.endMinute}`,
      })),
      examDate: examDate.trim(),
      examTime,
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
                <div key={i} className="flex flex-col gap-1.5 border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={session.dayOfWeek}
                      onChange={(e) => updateSession(i, 'dayOfWeek', e.target.value)}
                      className={selectClass + ' flex-shrink-0'}
                    >
                      {WEEK_DAYS_ORDER.map((d) => (
                        <option key={d} value={d}>{dayName(d)}</option>
                      ))}
                    </select>
                    {sessions.length > 1 && (
                      <button
                        onClick={() => removeSession(i)}
                        className="text-gray-400 hover:text-danger-500 cursor-pointer text-lg mr-auto"
                      >✕</button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-0.5" dir="ltr">
                      <select
                        value={session.startHour}
                        onChange={(e) => updateSession(i, 'startHour', e.target.value)}
                        className={selectClass}
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-gray-400 text-sm">:</span>
                      <select
                        value={session.startMinute}
                        onChange={(e) => updateSession(i, 'startMinute', e.target.value)}
                        className={selectClass}
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-gray-400 text-sm">تا</span>
                    <div className="flex items-center gap-0.5" dir="ltr">
                      <select
                        value={session.endHour}
                        onChange={(e) => updateSession(i, 'endHour', e.target.value)}
                        className={selectClass}
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-gray-400 text-sm">:</span>
                      <select
                        value={session.endMinute}
                        onChange={(e) => updateSession(i, 'endMinute', e.target.value)}
                        className={selectClass}
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {sessions.length < 7 && (
              <button
                onClick={addSession}
                className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium cursor-pointer"
              >
                + افزودن جلسه
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ساعت</label>
              <div className="flex items-center gap-0.5" dir="ltr">
                <select
                  value={examTimeHour}
                  onChange={(e) => setExamTimeHour(e.target.value)}
                  className={selectClass}
                >
                  <option value="">—</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-gray-400 text-sm">:</span>
                <select
                  value={examTimeMinute}
                  onChange={(e) => setExamTimeMinute(e.target.value)}
                  className={selectClass}
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
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
