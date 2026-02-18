import { useState } from 'react';
import type { Course } from '@/types';
import { dayName, WEEK_DAYS_ORDER, toEnglishDigits } from '@/utils/persian';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (course: Course) => void;
  editingCourse?: Course | null;
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

function courseToSessions(course: Course): SessionInput[] {
  return course.sessions.map((s) => {
    const [startH, startM] = s.startTime.split(':');
    const [endH, endM] = s.endTime.split(':');
    return {
      dayOfWeek: String(s.dayOfWeek),
      startHour: startH,
      startMinute: startM,
      endHour: endH,
      endMinute: endM,
    };
  });
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-purple-200/50 dark:border-purple-500/20 rounded-xl bg-white/80 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent';

const selectClass =
  'px-2 py-2 text-sm border border-purple-200/50 dark:border-purple-500/20 rounded-xl bg-white/80 dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400';

export function ManualCourseModal({ open, onClose, onSubmit, editingCourse }: Props) {
  if (!open) return null;

  // Key on editingCourse identity so React remounts the form with fresh state
  const formKey = editingCourse
    ? `edit-${editingCourse.courseCode}-${editingCourse.group}`
    : 'new';

  return (
    <div className="fixed inset-0 z-50 bg-purple-900/20 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl shadow-purple-500/10 border border-purple-200/30 dark:border-purple-500/15 w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <ManualCourseForm
          key={formKey}
          onClose={onClose}
          onSubmit={onSubmit}
          editingCourse={editingCourse}
        />
      </div>
    </div>
  );
}

function ManualCourseForm({
  onClose,
  onSubmit,
  editingCourse,
}: {
  onClose: () => void;
  onSubmit: (course: Course) => void;
  editingCourse?: Course | null;
}) {
  const isEditing = !!editingCourse;

  const [courseCode, setCourseCode] = useState(() => {
    if (!editingCourse) return '';
    // Show the code for editing, but hide auto-generated MANUAL-* codes
    return editingCourse.courseCode.startsWith('MANUAL-') ? '' : editingCourse.courseCode;
  });
  const [courseName, setCourseName] = useState(editingCourse?.courseName ?? '');
  const [professor, setProfessor] = useState(editingCourse?.professor ?? '');
  const [unitCount, setUnitCount] = useState(editingCourse ? String(editingCourse.unitCount) : '3');
  const [examDate, setExamDate] = useState(editingCourse?.examDate ?? '');
  const [examTimeHour, setExamTimeHour] = useState(() => {
    if (!editingCourse?.examTime) return '';
    return editingCourse.examTime.split(':')[0] || '';
  });
  const [examTimeMinute, setExamTimeMinute] = useState(() => {
    if (!editingCourse?.examTime) return '00';
    return editingCourse.examTime.split(':')[1] || '00';
  });
  const [sessions, setSessions] = useState<SessionInput[]>(
    editingCourse ? courseToSessions(editingCourse) : [emptySession()],
  );
  const [error, setError] = useState('');

  function updateSession(index: number, field: keyof SessionInput, value: string) {
    setSessions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function addSession() {
    if (sessions.length >= 14) return;
    setSessions((prev) => [...prev, emptySession()]);
  }

  function removeSession(index: number) {
    if (sessions.length <= 1) return;
    setSessions((prev) => prev.filter((_, i) => i !== index));
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
      courseCode: courseCode.trim() || editingCourse?.courseCode || `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      group: editingCourse?.group ?? 1,
      courseName: courseName.trim(),
      unitCount: units,
      gender: editingCourse?.gender ?? 'mixed',
      professor: professor.trim(),
      sessions: sessions.map((s) => ({
        dayOfWeek: Number(s.dayOfWeek),
        startTime: `${s.startHour}:${s.startMinute}`,
        endTime: `${s.endHour}:${s.endMinute}`,
      })),
      examDate: toEnglishDigits(examDate.trim()),
      examTime,
      location: editingCourse?.location ?? '',
      prerequisites: editingCourse?.prerequisites ?? '',
      notes: editingCourse?.notes ?? '',
      grade: editingCourse?.grade ?? '',
    };

    onSubmit(course);
    onClose();
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">{isEditing ? 'ویرایش درس' : 'افزودن درس دستی'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl cursor-pointer">✕</button>
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

        {/* Course code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">کد درس (اختیاری)</label>
          <input
            type="text"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className={inputClass}
            placeholder="مثلا: ۱۱۱۴۰۸۵"
            dir="ltr"
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
              <div key={i} className="flex flex-col gap-1.5 border border-purple-200/30 dark:border-purple-500/15 rounded-2xl p-2 bg-purple-50/20 dark:bg-purple-900/10">
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
          {sessions.length < 14 && (
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
          className="w-full py-2.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white font-medium rounded-2xl shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
        >
          {isEditing ? 'ذخیره تغییرات' : 'افزودن به برنامه'}
        </button>
      </div>
    </>
  );
}
