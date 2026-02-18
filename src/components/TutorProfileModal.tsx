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
    value >= 7 ? 'bg-accent-500' : value >= 4 ? 'bg-warning-400' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#6B5540] dark:text-[#9C8B7A] w-28 shrink-0 text-start">
        {label}
      </span>
      <div className="flex-1 h-3 bg-[#F0E6D8] dark:bg-[#3D352E] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-[#6B5540] dark:text-[#9C8B7A] w-10 text-start tabular-nums" dir="ltr">
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
                    className={`text-sm px-2.5 py-1 rounded-xl ${
                      val
                        ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400'
                        : 'bg-[#F0E6D8] dark:bg-[#3D352E] text-[#B8A898] dark:text-[#6B5D50]'
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
              <h4 className="text-sm font-semibold text-[#6B5540] dark:text-[#9C8B7A] mb-1">
                {SECTION_LABELS[key] || key}
              </h4>
              <div className="text-sm text-[#6B5540] dark:text-[#9C8B7A] bg-[#FAF7F2] dark:bg-[#1C1816] rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-line">
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
            <h4 className="text-sm font-semibold text-[#6B5540] dark:text-[#9C8B7A]">
              نظرات دانشجویان
            </h4>
          )}
          <div className="flex flex-col gap-1.5">
            {review.comments.map((c, i) => (
              <div
                key={i}
                className="text-sm text-[#6B5540] dark:text-[#9C8B7A] bg-[#FAF7F2] dark:bg-[#1C1816] rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-line"
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to original Telegram message + date */}
      {(review.messageId || review.date) && (
        <div className="flex items-center justify-between gap-2 text-xs text-[#B8A898] dark:text-[#6B5D50]">
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
        className="bg-[#FFF8F0] dark:bg-[#2A2420] rounded-2xl shadow-xl shadow-amber-900/10 border border-[#E8DED2] dark:border-[#3D352E] w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="font-bold text-lg text-[#3D2B1F] dark:text-[#E8DED2]">
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
              <div className="text-sm text-[#8B7355] dark:text-[#9C8B7A] mt-0.5">
                {tutor.rank && <span>{tutor.rank}</span>}
                {tutor.rank && tutor.workplace && <span> · </span>}
                {tutor.workplace && <span>{tutor.workplace}</span>}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#B8A898] hover:text-[#6B5540] dark:hover:text-[#9C8B7A] text-xl cursor-pointer shrink-0 mr-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* Course tabs (if multiple reviews with course names) */}
        {reviewsWithCourse.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tutor.reviews.map((r, i) => (
              <button
                key={i}
                onClick={() => setActiveReviewIdx(i)}
                className={`text-sm px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                  i === activeReviewIdx
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium'
                    : 'bg-[#F0E6D8] dark:bg-[#3D352E] text-[#6B5540] dark:text-[#9C8B7A] hover:bg-[#E8DED2] dark:hover:bg-[#4A403A]'
                }`}
              >
                {r.courseName || `نظر ${toPersianDigits((i + 1).toString())}`}
              </button>
            ))}
          </div>
        )}

        {/* Single course label */}
        {review.courseName && tutor.reviews.length <= 1 && (
          <div className="text-sm text-[#8B7355] dark:text-[#9C8B7A] mb-3">
            درس: {review.courseName}
          </div>
        )}

        <ReviewCard review={review} />

        {/* Source note */}
        <div className="mt-4 pt-3 border-t border-[#E8DED2] dark:border-[#3D352E]">
          <p className="text-xs text-[#B8A898] dark:text-[#6B5D50]">
            منبع: <a href="https://t.me/UTeacherz" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#6B5540] dark:hover:text-[#9C8B7A]">@UTeacherz</a>
          </p>
        </div>
      </div>
    </div>
  );
}
