import { useState, useEffect } from 'react';
import moment from 'moment-jalaali';
import type { TutorProfile, TutorReview } from '@/types';
import { toPersianDigits } from '@/utils/persian';

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

function toShamsiDate(gregorian: string): string {
  const m = moment(gregorian, 'YYYY-MM-DD');
  if (!m.isValid()) return '';
  const jy = m.jYear();
  const jm = m.jMonth(); // 0-indexed
  const jd = m.jDate();
  return `${toPersianDigits(jd.toString())} ${JALALI_MONTHS[jm]} ${toPersianDigits(jy.toString())}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  tutorId: string | null;
}

function RatingBar({ value, label }: { value: number; label: string }) {
  const pct = (value / 10) * 100;
  const color =
    value >= 7 ? 'bg-green-500' : value >= 4 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400 w-28 shrink-0 text-start">
        {label}
      </span>
      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-start tabular-nums" dir="ltr">
        {toPersianDigits(value.toString())}/۱۰
      </span>
    </div>
  );
}

const SECTION_LABELS: Record<string, string> = {
  'منبع تدریس': 'منبع تدریس',
  'حضور و غیاب': 'حضور و غیاب',
  'بارم بندی': 'بارم‌بندی',
  'وضع نمره دهی': 'وضع نمره‌دهی',
  'سطح امتحان': 'سطح امتحان',
  'تمرین و کوییز': 'تمرین و کوییز',
  'توضیحات بیشتر': 'توضیحات بیشتر',
};

function ReviewCard({ review }: { review: TutorReview }) {
  const hasRatings = review.averageRating !== undefined;
  const hasSections = review.sections && Object.keys(review.sections).length > 0;

  const flagLabels: [string, string][] = [
    ['نهاد', 'نهاد'],
    ['خلاصه نویسی', 'خلاصه‌نویسی'],
    ['میان ترم', 'میان‌ترم'],
    ['حضور و غیاب', 'حضور و غیاب'],
    ['تکلیف', 'تکلیف'],
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Structured ratings (Format A) */}
      {hasRatings && (
        <>
          <div className="flex flex-col gap-2">
            <RatingBar value={review.averageRating!} label="میانگین" />
            <RatingBar value={review.teachingRating!} label="اخلاق و تدریس" />
            <RatingBar value={review.gradingRating!} label="نمره‌دهی" />
          </div>

          {review.flags && (
            <div className="flex flex-wrap gap-2">
              {flagLabels.map(([key, display]) => {
                const val = review.flags![key];
                if (val === undefined) return null;
                return (
                  <span
                    key={key}
                    className={`text-sm px-2.5 py-1 rounded-lg ${
                      val
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {val ? '✅' : '❌'} {display}
                  </span>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Structured sections (Format B Extended) */}
      {hasSections && (
        <div className="flex flex-col gap-2.5">
          {Object.entries(review.sections!).map(([key, content]) => (
            <div key={key}>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {SECTION_LABELS[key] || key}
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5 leading-relaxed whitespace-pre-line">
                {content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments / prose reviews */}
      {review.comments.length > 0 && (
        <div className="flex flex-col gap-2">
          {(hasRatings || hasSections) && (
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              نظرات دانشجویان
            </h4>
          )}
          <div className="flex flex-col gap-1.5">
            {review.comments.map((c, i) => (
              <div
                key={i}
                className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5 leading-relaxed whitespace-pre-line"
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to original Telegram message + date */}
      {(review.messageId || review.date) && (
        <div className="flex items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
          {review.messageId ? (
            <a
              href={`https://t.me/UTeacherz/${review.messageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-500 dark:hover:text-primary-400"
              onClick={(e) => e.stopPropagation()}
            >
              مشاهده در تلگرام ←
            </a>
          ) : <span />}
          {review.date && (
            <span>{toShamsiDate(review.date)}</span>
          )}
        </div>
      )}
    </div>
  );
}

let tutorsCache: TutorProfile[] | null = null;

export function TutorProfileModal({ open, onClose, tutorId }: Props) {
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [tutors, setTutors] = useState<TutorProfile[] | null>(tutorsCache);

  useEffect(() => {
    if (!open || !tutorId || tutorsCache) return;
    import('@/data/tutors.json').then((m) => {
      tutorsCache = m.default as TutorProfile[];
      setTutors(tutorsCache);
    }).catch(() => {
      // Dynamic import can fail on slow connections or if chunk is missing
    });
  }, [open, tutorId]);

  if (!open || !tutorId) return null;
  if (!tutors) return null;

  const tutor = tutors.find((t) => t.id === tutorId);
  if (!tutor) return null;

  const review = tutor.reviews[activeReviewIdx] || tutor.reviews[0];

  // Reviews with course names for tabs
  const reviewsWithCourse = tutor.reviews.filter((r) => r.courseName);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
              {tutor.profileUrl ? (
                <a
                  href={tutor.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tutor.name}
                </a>
              ) : (
                tutor.name
              )}
            </h2>
            {(tutor.rank || tutor.workplace) && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {tutor.rank && <span>{tutor.rank}</span>}
                {tutor.rank && tutor.workplace && <span> · </span>}
                {tutor.workplace && <span>{tutor.workplace}</span>}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer shrink-0 p-1.5 -m-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Course tabs (if multiple reviews with course names) */}
        {reviewsWithCourse.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tutor.reviews.map((r, i) => (
              <button
                key={i}
                onClick={() => setActiveReviewIdx(i)}
                className={`text-sm px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  i === activeReviewIdx
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {r.courseName || `نظر ${toPersianDigits((i + 1).toString())}`}
              </button>
            ))}
          </div>
        )}

        {/* Single course label */}
        {review.courseName && tutor.reviews.length <= 1 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            درس: {review.courseName}
          </div>
        )}

        <ReviewCard review={review} />

        {/* Source note */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            منبع: <a href="https://t.me/UTeacherz" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300">@UTeacherz</a>
          </p>
        </div>
      </div>
    </div>
  );
}
