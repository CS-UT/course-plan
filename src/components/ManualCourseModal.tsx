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
  'w-full px-3 py-2 text-sm border border-[#2a2a4e] dark:border-[#3a3a5e] rounded-lg bg-[#0d0d18] dark:bg-gray-700 text-[#e0e0e8] dark:text-[#f0f0f8] focus:outline-none focus:ring-1 focus:ring-[#00f5ff]/50 focus:border-transparent';

const selectClass =
  'px-2 py-2 text-sm border border-[#2a2a4e] dark:border-[#3a3a5e] rounded-lg bg-[#0d0d18] dark:bg-gray-700 text-[#e0e0e8] dark:text-[#d0d0e0] focus:outline-none focus:ring-1 focus:ring-[#00f5ff]/50';

export function ManualCourseModal({ open, onClose, onSubmit, editingCourse }: Props) {
  if (!open) return null;

  // Key on editingCourse identity so React remounts the form with fresh state
  const formKey = editingCourse
    ? `edit-${editingCourse.courseCode}-${editingCourse.group}`
    : 'new';

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0d0d18] dark:bg-[#12122a] rounded-xl shadow-[0_0_30px_rgba(0,245,255,0.08)] border border-[#1a1a2e] dark:border-[#2a2a4e] w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
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
        <h2 className="font-bold text-lg text-[#e0e0e8] dark:text-[#f0f0f8]">{isEditing ? 'ویرایش درس' : 'افزودن درس دستی'}</h2>
        <button onClick={onClose} className="text-[#3a3a5a] hover:text-[#6a6a8a] dark:hover:text-[#5a5a7a] text-xl cursor-pointer">✕</button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Course name */}
        <div>
          <label className="block text-sm font-medium text-[#8a8aaa] dark:text-[#a0a0c0] mb-1">نام درس *</label>
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
          <label className="block text-sm font-medium text-[#8a8aaa] dark:text-[#a0a0c0] mb-1">کد درس (اختیاری)</label>
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
          <label className="block text-sm font-medium text-[#8a8aaa] dark:text-[#a0a0c0] mb-1">تعداد واحد *</label>
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
          <label className="block text-sm font-medium text-[#8a8aaa] dark:text-[#a0a0c0] mb-1">جلسات *</label>
          <div className="flex flex-col gap-2">
            {sessions.map((session, i) => (
              <div key={i} className="flex flex-col gap-1.5 border border-[#1a1a2e] dark:border-[#2a2a4e] rounded-lg p-2">
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
                      className="text-[#3a3a5a] hover:text-[#ff0055] cursor-pointer text-lg mr-auto"
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
                    <span className="text-[#3a3a5a] text-sm">:</span>
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
                  <span className="text-[#3a3a5a] text-sm">تا</span>
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
                    <span className="text-[#3a3a5a] text-sm">:</span>
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
              className="mt-2 text-xs text-[#00f5ff] dark:text-[#00f5ff] hover:text-[#00f5ff] dark:hover:text-[#67e8f9] font-medium cursor-pointer"
            >
              + افزودن جلسه
            </button>
          )}
        </div>

        {/* Professor */}
        <div>
          <label className="block text-sm font-medium text-[#8a8aaa] dark:text-[#a0a0c0] mb-1">نام استاد (اختیاری)</label>
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
            <label className="block text-sm font-medium text-[#8a8aaa] dark:text-[#a0a0c0] mb-1">تاریخ امتحان (اختیاری)</label>
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
            <label className="block text-sm font-medium text-[#8a8aaa] dark:text-[#a0a0c0] mb-1">ساعت</label>
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
              <span className="text-[#3a3a5a] text-sm">:</span>
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
        <p className="text-xs text-[#3a3a5a] dark:text-[#4a4a6a] -mt-2">
          بدون تاریخ امتحان، تداخل امتحان بررسی نمی‌شود
        </p>

        {/* Error */}
        {error && (
          <p className="text-xs text-[#ff0055] dark:text-[#ff4081]">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-2.5 bg-[#00f5ff] hover:bg-[#00d4e0] text-[#0a0a0f] font-medium rounded-xl transition-colors cursor-pointer"
        >
          {isEditing ? 'ذخیره تغییرات' : 'افزودن به برنامه'}
        </button>
      </div>
    </>
  );
}
