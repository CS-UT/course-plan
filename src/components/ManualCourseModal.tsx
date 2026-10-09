import { useEffect, useRef, useState } from 'react';
import type { Course, CourseSession, ScheduleEntryType } from '@/types';
import { dayName, WEEK_DAYS_ORDER, toEnglishDigits, toPersianDigits } from '@/utils/persian';
import { ENTRY_TYPE_LABELS, isCreditCourse, isInternalCourseCode } from '@/utils/courses';
import { CourseDetails } from '@/components/CourseDetails';
import { FormSelect } from '@/components/FormSelect';
import { TimeSelect } from '@/components/TimeSelect';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (course: Course) => void;
  editingCourse?: Course | null;
  selectedCourses: Course[];
}

const emptySession = (): CourseSession => ({ dayOfWeek: 6, startTime: '08:00', endTime: '10:00' });
const courseKey = (course: { courseCode: string; group: number }) => JSON.stringify([course.courseCode, course.group]);
const inputClass =
  'w-full min-w-0 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export function ManualCourseModal({ open, onClose, onSubmit, editingCourse, selectedCourses }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <ManualCourseForm key={editingCourse ? courseKey(editingCourse) : 'new'} onClose={onClose} onSubmit={onSubmit} editingCourse={editingCourse} selectedCourses={selectedCourses} />
    </div>
  );
}

function ManualCourseForm({ onClose, onSubmit, editingCourse, selectedCourses }: Omit<Props, 'open'>) {
  const isEditing = !!editingCourse;
  const [entryType, setEntryType] = useState<ScheduleEntryType>(editingCourse?.entryType ?? 'course');
  const isCourse = entryType === 'course';
  const [relatedCourseKey, setRelatedCourseKey] = useState(editingCourse?.relatedCourse ? courseKey(editingCourse.relatedCourse) : '');
  const availableCourses = selectedCourses.filter((course) => isCreditCourse(course) && (!editingCourse || courseKey(course) !== courseKey(editingCourse)));
  const relatedCourse = availableCourses.find((course) => courseKey(course) === relatedCourseKey);
  const [courseCode, setCourseCode] = useState(() => {
    const code = editingCourse?.courseCode ?? '';
    return isInternalCourseCode(code) ? '' : code;
  });
  const [courseName, setCourseName] = useState(editingCourse?.courseName ?? '');
  const [professor, setProfessor] = useState(editingCourse?.professor ?? '');
  const [unitCount, setUnitCount] = useState(editingCourse && isCreditCourse(editingCourse) ? String(editingCourse.unitCount) : '3');
  const [examDate, setExamDate] = useState(editingCourse?.examDate ?? '');
  const [examTime, setExamTime] = useState(editingCourse?.examTime ?? '');
  const [sessions, setSessions] = useState<CourseSession[]>(editingCourse?.sessions.length ? editingCourse.sessions.map((session) => ({ ...session })) : [emptySession()]);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    formRef.current?.querySelector<HTMLInputElement>('#manual-name')?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const controls = formRef.current?.querySelectorAll<HTMLElement>('button, input, select');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  function updateSession(index: number, updates: Partial<CourseSession>) {
    setSessions((previous) => previous.map((session, i) => i === index ? { ...session, ...updates } : session));
    setError('');
  }

  function selectRelatedCourse(key: string) {
    setRelatedCourseKey(key);
    const course = availableCourses.find((candidate) => courseKey(candidate) === key);
    if (course) setCourseName(`حل تمرین ${course.courseName}`);
    setError('');
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!courseName.trim()) {
      setError(isCourse ? 'نام درس الزامی است' : 'نام الزامی است');
      return;
    }
    const units = isCourse ? Number(toEnglishDigits(unitCount)) : 0;
    if (isCourse && (!Number.isInteger(units) || units < 1 || units > 6)) {
      setError('تعداد واحد باید عددی بین ۱ تا ۶ باشد');
      return;
    }
    if (sessions.some((session) => !session.startTime || !session.endTime || session.startTime >= session.endTime)) {
      setError('ساعت شروع باید قبل از ساعت پایان باشد');
      return;
    }
    const generatedCode = () => `MANUAL-${crypto.randomUUID()}`;
    const savedCode = editingCourse?.courseCode;
    const internalCode = savedCode && isInternalCourseCode(savedCode);
    const course: Course = {
      entryType,
      relatedCourse: entryType === 'tutorial' && relatedCourseKey ? relatedCourse ? { courseCode: relatedCourse.courseCode, group: relatedCourse.group } : editingCourse?.relatedCourse : undefined,
      courseCode: isCourse ? courseCode.trim() || savedCode || generatedCode() : internalCode ? savedCode! : generatedCode(),
      group: editingCourse?.group ?? 1,
      courseName: courseName.trim(),
      unitCount: units,
      gender: editingCourse?.gender ?? 'mixed',
      professor: isCourse ? professor.trim() : '',
      sessions,
      examDate: isCourse ? toEnglishDigits(examDate.trim()) : '',
      examDay: isCourse && !examDate.trim() ? editingCourse?.examDay : undefined,
      examTime: isCourse ? examTime : '',
      location: isCourse ? editingCourse?.location ?? '' : '',
      prerequisites: isCourse ? editingCourse?.prerequisites ?? '' : '',
      notes: isCourse ? editingCourse?.notes ?? '' : '',
      grade: isCourse ? editingCourse?.grade ?? '' : '',
    };
    if (selectedCourses.some((selected) => courseKey(selected) === courseKey(course) && (!editingCourse || courseKey(selected) !== courseKey(editingCourse)))) {
      setError('درسی با این کد و گروه در برنامه وجود دارد');
      return;
    }
    onSubmit(course);
    onClose();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="manual-entry-title" className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90dvh] overflow-y-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 id="manual-entry-title" className="font-bold text-lg text-gray-900 dark:text-gray-100">{isEditing ? 'ویرایش برنامه' : 'افزودن به برنامه'}</h2>
        <button type="button" onClick={onClose} aria-label="بستن" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer p-2 -m-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m18 6-12 12M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className={labelClass}>نوع مورد</legend>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 dark:bg-gray-900/50 p-1">
            {(Object.keys(ENTRY_TYPE_LABELS) as ScheduleEntryType[]).map((type) => (
              <label key={type} className={`relative cursor-pointer rounded-lg px-2 py-2.5 text-center text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-primary-400 ${entryType === type ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>
                <input type="radio" name="entryType" value={type} checked={entryType === type} className="sr-only" onChange={() => { setEntryType(type); setError(''); }} />
                {ENTRY_TYPE_LABELS[type]}
              </label>
            ))}
          </div>
        </fieldset>
        {entryType === 'tutorial' && (
          <div>
            <label htmlFor="manual-related-course" className={labelClass}>درس مرتبط (اختیاری)</label>
            <FormSelect id="manual-related-course" value={relatedCourseKey} onChange={(event) => selectRelatedCourse(event.target.value)} disabled={!availableCourses.length && !relatedCourseKey}>
              <option value="">{availableCourses.length || relatedCourseKey ? 'بدون انتخاب درس' : 'ابتدا یک درس به برنامه اضافه کنید'}</option>
              {relatedCourseKey && !relatedCourse && <option value={relatedCourseKey}>درس مرتبط قبلی (در این برنامه نیست)</option>}
              {availableCourses.map((course) => <option key={courseKey(course)} value={courseKey(course)}>{course.courseName} — گروه {toPersianDigits(course.group)}</option>)}
            </FormSelect>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{availableCourses.length ? 'با انتخاب درس، نام حل تمرین پر می‌شود و قابل تغییر است.' : relatedCourseKey ? 'درس مرتبط قبلی در این برنامه نیست. نام را می‌توانید دستی تغییر دهید.' : 'برای اتصال حل تمرین به یک درس، ابتدا آن درس را به برنامه اضافه کنید.'}</p>
          </div>
        )}
        <div>
          <label htmlFor="manual-name" className={labelClass}>{isCourse ? 'نام درس' : entryType === 'tutorial' ? 'نام حل تمرین' : 'نام'} *</label>
          <input id="manual-name" type="text" required value={courseName} onChange={(event) => { setCourseName(event.target.value); setError(''); }} className={inputClass} placeholder={isCourse ? 'مثلاً: ریاضی عمومی ۱' : entryType === 'tutorial' ? 'مثلاً: حل تمرین ریاضی عمومی ۱' : 'مثلاً: مطالعه یا ورزش'} />
        </div>
        {isCourse && (
          <>
            {editingCourse && <CourseDetails course={editingCourse} />}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="manual-code" className={labelClass}>کد درس (اختیاری)</label>
                <input id="manual-code" type="text" value={courseCode} onChange={(event) => setCourseCode(event.target.value)} className={inputClass} placeholder="مثلاً: ۱۱۱۴۰۸۵" dir="ltr" />
              </div>
              <div>
                <label htmlFor="manual-units" className={labelClass}>تعداد واحد *</label>
                <input id="manual-units" type="number" required min={1} max={6} step={1} value={unitCount} onChange={(event) => setUnitCount(event.target.value)} className={inputClass} />
              </div>
            </div>
          </>
        )}
        <fieldset>
          <legend className={labelClass}>روز و ساعت *</legend>
          <div className="flex flex-col gap-2">
            {sessions.map((session, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label htmlFor={`manual-day-${index}`} className="text-xs text-gray-600 dark:text-gray-400">بازه {toPersianDigits(index + 1)}</label>
                  {sessions.length > 1 && <button type="button" onClick={() => { setSessions((previous) => previous.filter((_, i) => i !== index)); setError(''); }} aria-label={`حذف بازه ${toPersianDigits(index + 1)}`} className="text-xs text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10 px-2 py-1 rounded-md cursor-pointer">حذف</button>}
                </div>
                <FormSelect id={`manual-day-${index}`} value={session.dayOfWeek} onChange={(event) => updateSession(index, { dayOfWeek: Number(event.target.value) })}>
                  {[...WEEK_DAYS_ORDER, 4, 5].map((day) => <option key={day} value={day}>{dayName(day)}</option>)}
                </FormSelect>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <TimeSelect id={`manual-start-${index}`} label="از ساعت" value={session.startTime} onChange={(value) => updateSession(index, { startTime: value })} />
                  <TimeSelect id={`manual-end-${index}`} label="تا ساعت" value={session.endTime} onChange={(value) => updateSession(index, { endTime: value })} />
                </div>
              </div>
            ))}
          </div>
          {sessions.length < 14 && <button type="button" onClick={() => { setSessions((previous) => [...previous, emptySession()]); setError(''); }} className="mt-2 px-2 py-1.5 text-sm text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg font-medium cursor-pointer">+ افزودن بازه زمانی</button>}
        </fieldset>
        {isCourse && (
          <>
            <div>
              <label htmlFor="manual-professor" className={labelClass}>نام استاد (اختیاری)</label>
              <input id="manual-professor" type="text" value={professor} onChange={(event) => setProfessor(event.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="manual-exam-date" className={labelClass}>تاریخ امتحان (اختیاری)</label>
                <input id="manual-exam-date" type="text" value={examDate} onChange={(event) => setExamDate(event.target.value)} className={inputClass} placeholder="۱۴۰۵/۱۰/۲۴" dir="ltr" />
              </div>
              <TimeSelect id="manual-exam-time" label="ساعت امتحان (اختیاری)" value={examTime} onChange={setExamTime} optional />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">بدون تاریخ امتحان، تداخل امتحان بررسی نمی‌شود</p>
          </>
        )}
        {error && <p role="alert" className="text-sm text-danger-600 dark:text-danger-400">{error}</p>}
        <button type="submit" className="w-full py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-xl transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">{isEditing ? 'ذخیره تغییرات' : 'افزودن به برنامه'}</button>
      </div>
    </form>
  );
}
