import { useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { onboardingCompletedAtom } from '@/atoms';
import { welcomeSlides } from './welcomeSlides';

interface Props {
  onStartTour: () => void;
}

export function WelcomeModal({ onStartTour }: Props) {
  const [completed, setCompleted] = useAtom(onboardingCompletedAtom);
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);

  // Don't render if onboarding already completed
  if (completed) return null;

  const isLastSlide = currentSlide === welcomeSlides.length - 1;

  function dismiss() {
    setCompleted(true); // Persists to localStorage via atomWithStorage
  }

  function handleSkip() {
    dismiss();
  }

  function handleStartTour() {
    dismiss();
    onStartTour();
  }

  function goToSlide(index: number) {
    setCurrentSlide(Math.max(0, Math.min(index, welcomeSlides.length - 1)));
  }

  // Touch swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) goToSlide(currentSlide + 1); // Swipe left = next
    if (delta > 50) goToSlide(currentSlide - 1); // Swipe right = prev
  }

  return (
    <div data-export-exclude className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slides area */}
        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(${currentSlide * 100}%)` }}
          >
            {welcomeSlides.map((slide) => (
              <div
                key={slide.id}
                className="w-full flex-shrink-0 p-6 text-center"
              >
                <div className="text-4xl mb-3">{slide.icon}</div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {slide.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {slide.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {welcomeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                i === currentSlide
                  ? 'bg-primary-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between px-6 pb-5">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          >
            رد شدن
          </button>
          {isLastSlide ? (
            <button
              onClick={handleStartTour}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              شروع راهنما
            </button>
          ) : (
            <button
              onClick={() => goToSlide(currentSlide + 1)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              بعدی
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
