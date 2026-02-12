import { useState } from 'react';
import type { TutorProfile, TutorReview } from '@/types';
import { toPersianDigits } from '@/utils/persian';
import tutorsData from '@/data/tutors.json';

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
      <span className="text-xs text-gray-600 dark:text-gray-400 w-28 shrink-0 text-start">
        {label}
      </span>
      <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-10 text-start tabular-nums" dir="ltr">
        {toPersianDigits(value.toString())}/۱۰
      </span>
    </div>
  );
}

function ReviewCard({ review }: { review: TutorReview }) {
  const flagLabels: [string, string][] = [
    ['نهاد', 'نهاد'],
    ['خلاصه نویسی', 'خلاصه‌نویسی'],
    ['میان ترم', 'میان‌ترم'],
    ['حضور و غیاب', 'حضور و غیاب'],
    ['تکلیف', 'تکلیف'],
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Ratings */}
      <div className="flex flex-col gap-2">
        <RatingBar value={review.averageRating} label="میانگین" />
        <RatingBar value={review.teachingRating} label="اخلاق و تدریس" />
        <RatingBar value={review.gradingRating} label="نمره‌دهی" />
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-2">
        {flagLabels.map(([key, display]) => {
          const val = review.flags[key];
          if (val === undefined) return null;
          return (
            <span
              key={key}
              className={`text-xs px-2 py-1 rounded-lg ${
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

      {/* Reactions */}
      {(review.thumbsUp > 0 || review.thumbsDown > 0) && (
        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
          {review.thumbsUp > 0 && (
            <span>👍 {toPersianDigits(review.thumbsUp.toString())}</span>
          )}
          {review.thumbsDown > 0 && (
            <span>👎 {toPersianDigits(review.thumbsDown.toString())}</span>
          )}
        </div>
      )}

      {/* Comments */}
      {review.comments.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
            نظرات دانشجویان
          </h4>
          <div className="flex flex-col gap-1.5">
            {review.comments.map((c, i) => (
              <div
                key={i}
                className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 leading-relaxed"
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TutorProfileModal({ open, onClose, tutorId }: Props) {
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  if (!open || !tutorId) return null;

  const tutor = (tutorsData as TutorProfile[]).find((t) => t.id === tutorId);
  if (!tutor) return null;

  const review = tutor.reviews[activeReviewIdx] || tutor.reviews[0];

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {tutor.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Course tabs (if multiple reviews) */}
        {tutor.reviews.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tutor.reviews.map((r, i) => (
              <button
                key={i}
                onClick={() => setActiveReviewIdx(i)}
                className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  i === activeReviewIdx
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {r.courseName}
              </button>
            ))}
          </div>
        )}

        {/* Single course label */}
        {tutor.reviews.length === 1 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            درس: {review.courseName}
          </div>
        )}

        <ReviewCard review={review} />

        {/* Source note */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            منبع: کانال اساتید دانشگاه تهران
          </p>
        </div>
      </div>
    </div>
  );
}
