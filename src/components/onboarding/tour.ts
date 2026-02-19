import { driver } from 'driver.js';
import type { DriveStep } from 'driver.js';
import { tourSteps } from './steps';
import { toPersianDigits } from '@/utils/persian';

/** Check viewport width at call time (not module load) */
function isMobile(): boolean {
  return window.innerWidth < 1024;
}

/**
 * Launch the driver.js guided tour with device-aware steps,
 * Persian UI labels, and Persian digit progress indicators.
 *
 * @param onComplete - Optional callback fired when tour finishes or is dismissed
 */
export function startTour(onComplete?: () => void): void {
  const mobile = isMobile();

  const filteredSteps = tourSteps.filter(
    (step) =>
      step.device === 'both' ||
      (step.device === 'mobile' && mobile) ||
      (step.device === 'desktop' && !mobile),
  );

  const steps: DriveStep[] = filteredSteps.map((step) => ({
    element: step.targetSelector,
    popover: {
      title: step.title,
      description: step.description,
      side: step.side,
      align: step.align,
    },
  }));

  const driverInstance = driver({
    steps,
    showProgress: true,
    progressText: '{{current}} از {{total}}',
    nextBtnText: 'بعدی',
    prevBtnText: 'قبلی',
    doneBtnText: 'پایان',
    allowClose: true,
    allowKeyboardControl: true,
    animate: true,
    smoothScroll: true,
    overlayOpacity: 0.5,
    stagePadding: 8,
    stageRadius: 8,
    popoverOffset: 12,
    showButtons: ['next', 'previous', 'close'],
    onPopoverRender: (popover) => {
      popover.progress.textContent = toPersianDigits(
        popover.progress.textContent || '',
      );
    },
    onDestroyed: () => {
      onComplete?.();
    },
  });

  driverInstance.drive();
}
