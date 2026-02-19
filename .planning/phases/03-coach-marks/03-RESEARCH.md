# Phase 3: Coach Marks Tour - Research

**Researched:** 2026-02-19
**Domain:** driver.js tour configuration, RTL popover rendering, device-adaptive step filtering
**Confidence:** HIGH

## Summary

Phase 3 configures and launches a driver.js guided tour that spotlights real UI elements with device-appropriate steps. The Phase 1 foundation (driver.js v1.4.0 installed, CSS overrides for dark mode + RTL, 7 step definitions with device flags, 7 `data-tour` attributes on stable wrapper elements) is complete and verified.

The core task is writing a `startTour()` function that: (1) filters step definitions by device type (desktop vs mobile), (2) maps them to driver.js `DriveStep[]` format, (3) configures the driver instance with Persian button labels and progress text, (4) uses `onPopoverRender` to convert Western digits to Persian in the progress indicator, and (5) handles tour completion by setting the `onboardingCompletedAtom`. Driver.js handles viewport-aware repositioning, Escape key dismissal, and overlay rendering out of the box.

**Primary recommendation:** Create a single `useTour` hook (or plain `startTour` function) in `src/components/onboarding/tour.ts` that filters steps by `window.innerWidth`, configures driver.js with Persian labels, and uses `onPopoverRender` to fix Western digits in progress text. The function should accept an optional callback for marking onboarding complete.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| driver.js | 1.4.0 | Tour engine: spotlight overlay, popover positioning, keyboard nav, step sequencing | Already installed in Phase 1. ~5kb gzipped, React-version-agnostic, MIT licensed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jotai | 2.17.1 | Persist `onboardingCompletedAtom` to localStorage | Already in project. Set atom on tour finish |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| driver.js | Custom spotlight from scratch | Full control but 300+ LOC for overlay math, scroll tracking, repositioning. driver.js handles all this |
| `onPopoverRender` digit fix | Custom progress element | More work, duplicates driver.js footer layout. `onPopoverRender` is 3 lines |

**Installation:**
No new packages needed. driver.js 1.4.0 already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/components/onboarding/
  steps.ts              # [EXISTS] Tour step definitions with device flag
  driver-overrides.css  # [EXISTS] Dark mode + RTL CSS overrides
  tour.ts               # [NEW] startTour() function — tour configuration + launch
  index.ts              # [UPDATE] Add tour.ts exports
```

### Pattern 1: Device-Filtered Step Mapping
**What:** Filter `tourSteps` array by device type before passing to driver.js, then map `TourStepDef` to driver.js `DriveStep` format.
**When to use:** At tour launch time, so steps match the current viewport.

```typescript
// Source: verified against driver.js v1.4.0 type definitions
import { driver, type DriveStep } from 'driver.js';
import { tourSteps, type TourStepDef } from './steps';

function isMobile(): boolean {
  return window.innerWidth < 1024; // matches Tailwind lg: breakpoint
}

function filterSteps(steps: TourStepDef[]): TourStepDef[] {
  const mobile = isMobile();
  return steps.filter(s =>
    s.device === 'both' || (mobile ? s.device === 'mobile' : s.device === 'desktop')
  );
}

function toDriverStep(step: TourStepDef): DriveStep {
  return {
    element: step.targetSelector,
    popover: {
      title: step.title,
      description: step.description,
      side: step.side,
      align: step.align,
    },
  };
}
```

### Pattern 2: Persian Progress via onPopoverRender
**What:** The `progressText` template substitutes `{{current}}` and `{{total}}` with Western digits (1, 2, 3). Use `onPopoverRender` to convert the progress element's text content to Persian digits after rendering.
**When to use:** Always — this is the only way to get Persian digits in the progress indicator without completely replacing the progress element.

```typescript
// Source: verified in driver.js v1.4.0 source (dist/driver.js.mjs line 568)
// progressText template: "{{current}} of {{total}}" — substituted as plain numbers
import { toPersianDigits } from '@/utils/persian';

const driverInstance = driver({
  showProgress: true,
  progressText: '{{current}} از {{total}}',
  onPopoverRender: (popover) => {
    // popover.progress is the HTMLElement containing "1 از 5" etc.
    popover.progress.textContent = toPersianDigits(popover.progress.textContent || '');
  },
});
```

### Pattern 3: Tour Lifecycle with Completion Callback
**What:** Wire up `onDestroyed` hook to call a completion callback (which sets `onboardingCompletedAtom`). Use `onDestroyStarted` for cleanup if needed.
**When to use:** When Phase 2's WelcomeModal calls `startTour()`.

```typescript
// Source: driver.js v1.4.0 type definitions — DriverHook and Config types
export function startTour(onComplete?: () => void): void {
  const steps = filterSteps(tourSteps);
  const driverSteps = steps.map(toDriverStep);

  const driverInstance = driver({
    steps: driverSteps,
    showProgress: true,
    progressText: '{{current}} از {{total}}',
    nextBtnText: 'بعدی',
    prevBtnText: 'قبلی',
    doneBtnText: 'پایان',
    allowClose: true,
    allowKeyboardControl: true,
    animate: true,
    overlayOpacity: 0.5,
    stagePadding: 8,
    stageRadius: 8,
    popoverOffset: 12,
    showButtons: ['next', 'previous', 'close'],
    onPopoverRender: (popover) => {
      popover.progress.textContent = toPersianDigits(popover.progress.textContent || '');
    },
    onDestroyed: () => {
      onComplete?.();
    },
  });

  driverInstance.drive();
}
```

### Anti-Patterns to Avoid
- **Targeting FullCalendar internals:** FullCalendar re-renders its internal DOM elements. Never use `.fc-*` selectors as tour targets. Always target the stable wrapper `[data-tour="calendar"]` element. (Decision from Phase 1, plan 01-02.)
- **Checking device once at module load:** The `isMobile()` check must happen at tour launch time, not at import time. Users might rotate their device or resize their browser before launching the tour.
- **Rendering driver.js inside React lifecycle:** driver.js manipulates the DOM directly. Don't wrap it in `useEffect` with dependencies that cause re-runs. Call `startTour()` imperatively (e.g., from a button click handler or modal callback), not as a side effect of state changes.
- **Using `onNextClick`/`onPrevClick` to swap arrow key direction for RTL:** driver.js hardcodes ArrowRight=Next, ArrowLeft=Previous. This actually matches visual RTL expectation since the "Next" button appears on the left in RTL layout (due to `flex-direction: row-reverse` in CSS overrides). Overriding would create confusion. Leave the defaults.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spotlight overlay with cutout | SVG overlay + clip-path math | driver.js built-in overlay | Handles scroll, resize, animation transitions, padding, border-radius |
| Popover positioning near viewport edges | Manual `getBoundingClientRect` + fallback logic | driver.js auto-repositioning | Already implements fallback: preferred side -> opposite side -> center with arrow hidden (verified in source, lines 360-428) |
| Escape key dismissal | `addEventListener('keyup', ...)` | driver.js `allowClose: true` + `allowKeyboardControl: true` (both default to true) | Handles Escape, ArrowLeft, ArrowRight out of the box |
| Scroll to off-screen elements | `scrollIntoView` with timing | driver.js `smoothScroll: true` | Handles partial visibility, large elements, animation coordination |
| Step sequencing + state | Custom step index + navigation logic | driver.js `drive()`, `moveNext()`, `movePrevious()` | Tracks active index, previous/next step, handles edge cases (first/last step) |

**Key insight:** driver.js handles all the hard DOM-manipulation problems (overlay math, viewport repositioning, scroll coordination, keyboard control). The only customization needed is Persian text and device-based step filtering, both of which are trivial.

## Common Pitfalls

### Pitfall 1: Western Digits in Progress Text
**What goes wrong:** `progressText: '{{current}} از {{total}}'` renders as `"1 از 5"` instead of `"۱ از ۵"` because driver.js substitutes `{{current}}` and `{{total}}` with JavaScript numbers (Western digits).
**Why it happens:** driver.js does a simple string `.replace("{{current}}", \`${index + 1}\`)` (verified in source line 568). No locale-aware formatting.
**How to avoid:** Use `onPopoverRender` to call `toPersianDigits()` on the progress element's text content after driver.js renders it.
**Warning signs:** Progress shows "1 از 5" instead of "۱ از ۵" during visual testing.

### Pitfall 2: Element Not Found at Tour Start
**What goes wrong:** Tour step targets an element that doesn't exist in the DOM (e.g., `[data-tour="mobile-add-btn"]` on desktop, or `[data-tour="course-search"]` on mobile where the sidebar is hidden via `hidden lg:block`).
**Why it happens:** Steps are not filtered by device before passing to driver.js. Or an element is conditionally rendered and not yet in the DOM.
**How to avoid:** Always filter steps using `isMobile()` at launch time. Desktop-only steps (`device: 'desktop'`) get `[data-tour="course-search"]`. Mobile-only steps (`device: 'mobile'`) get `[data-tour="mobile-add-btn"]`. Both elements exist in the DOM (the sidebar has `hidden lg:block`, so it exists but is hidden with `display: none`; the mobile FAB has `lg:hidden`, so it exists but is hidden on desktop).
**Warning signs:** driver.js skips a step silently or shows a popover without a spotlight.

### Pitfall 3: Tour Launched Before DOM is Ready
**What goes wrong:** `startTour()` is called immediately on page load before `data-tour` elements are rendered.
**Why it happens:** React hydration or lazy-loading delays element availability.
**How to avoid:** Call `startTour()` from a user action (WelcomeModal "Start Tour" button click or "?" help button) — never on mount. This guarantees the DOM is fully rendered.
**Warning signs:** First step has no spotlight highlight, or tour starts on wrong element.

### Pitfall 4: Arrow Keys Seem "Reversed" in RTL
**What goes wrong:** Tester reports ArrowRight should go to "Previous" in RTL, but it goes to "Next".
**Why it happens:** driver.js hardcodes ArrowRight=Next, ArrowLeft=Previous (source line 220). This is not RTL-aware.
**How to avoid:** This is actually correct behavior when viewed with the existing RTL CSS overrides. The CSS in `driver-overrides.css` applies `flex-direction: row-reverse` to the navigation buttons, which puts "Next" on the left side of the footer. Since ArrowRight is "forward in the tour" (not "visual right"), this matches user expectation. Don't override it — just document the intentional behavior.
**Warning signs:** None if CSS overrides are correct. Test by pressing arrow keys during the tour.

### Pitfall 5: driver.js Overlay Blocks Click Events After Tour
**What goes wrong:** After tour ends, the overlay or `driver-active` class remains, blocking page interaction.
**Why it happens:** Tour was not properly destroyed (e.g., a React component unmounted while tour was active).
**How to avoid:** driver.js `destroy()` is called automatically when the user finishes the tour (clicks "Done") or closes it (Escape / close button). If using `onNextClick`/`onPrevClick` overrides, you MUST call `driverInstance.moveNext()`/`driverInstance.movePrevious()` yourself — the override replaces the default behavior entirely. For this project, don't override `onNextClick`/`onPrevClick` — let defaults handle navigation.
**Warning signs:** Page becomes unclickable after dismissing the tour.

### Pitfall 6: Popover Clipping on Small Mobile Screens
**What goes wrong:** Popover text is cut off at viewport edges on narrow screens (< 400px).
**Why it happens:** Popover has a fixed minimum width that exceeds the viewport.
**How to avoid:** driver.js auto-repositioning (verified in source) handles most cases — it falls back to centering the popover if no side has enough space. For extra safety, add a CSS override:
```css
@media (max-width: 480px) {
  .driver-popover {
    max-width: calc(100vw - 24px);
  }
}
```
**Warning signs:** Horizontal scrollbar appears during tour on mobile.

## Code Examples

Verified patterns from official sources:

### Complete startTour Function
```typescript
// Source: driver.js v1.4.0 type definitions + source code analysis
import { driver } from 'driver.js';
import { tourSteps } from './steps';
import { toPersianDigits } from '@/utils/persian';

const MOBILE_BREAKPOINT = 1024; // matches Tailwind lg:

function isMobile(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function startTour(onComplete?: () => void): void {
  const mobile = isMobile();
  const activeSteps = tourSteps
    .filter(s => s.device === 'both' || (mobile ? s.device === 'mobile' : s.device === 'desktop'))
    .map(s => ({
      element: s.targetSelector,
      popover: {
        title: s.title,
        description: s.description,
        side: s.side as 'top' | 'bottom' | 'left' | 'right',
        align: s.align as 'start' | 'center' | 'end',
      },
    }));

  const d = driver({
    steps: activeSteps,
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
      popover.progress.textContent = toPersianDigits(popover.progress.textContent || '');
    },
    onDestroyed: () => {
      onComplete?.();
    },
  });

  d.drive();
}
```

### PopoverDOM Type (for onPopoverRender reference)
```typescript
// Source: driver.js v1.4.0 dist/driver.js.d.ts
type PopoverDOM = {
  wrapper: HTMLElement;
  arrow: HTMLElement;
  title: HTMLElement;
  description: HTMLElement;
  footer: HTMLElement;
  progress: HTMLElement;         // <-- this is where progress text lives
  previousButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  footerButtons: HTMLElement;
};
```

### Integration Point: Phase 2's WelcomeModal Calls startTour
```typescript
// In WelcomeModal component (Phase 2 will implement):
import { startTour } from '@/components/onboarding';
import { useSetAtom } from 'jotai';
import { onboardingCompletedAtom } from '@/atoms';

function WelcomeModal() {
  const setOnboardingCompleted = useSetAtom(onboardingCompletedAtom);

  function handleStartTour() {
    // Close the modal first, then start the tour
    startTour(() => {
      setOnboardingCompleted(true);
    });
  }

  function handleSkip() {
    setOnboardingCompleted(true);
  }
  // ...
}
```

### Mobile Viewport CSS Safety Net
```css
/* Add to driver-overrides.css */
@media (max-width: 480px) {
  .driver-popover {
    max-width: calc(100vw - 24px);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| driver.js `onPopovered` callback | `onPopoverRender` callback | v1.3.0+ | Must use `onPopoverRender` — old name removed |
| `{current}` single braces in progressText | `{{current}}` double braces | v1.0+ | Template uses double curly braces for substitution |
| Manual `document.querySelector` for step targets | `element` accepts string selector directly | v1.0+ | Pass CSS selector string; driver.js resolves it |

**Deprecated/outdated:**
- `onPopovered` / `onPopover`: Old callback names from pre-1.3 versions. Use `onPopoverRender` in v1.4.0.

## Open Questions

1. **Arrow key direction in RTL: is the current behavior acceptable?**
   - What we know: driver.js hardcodes ArrowRight=moveNext, ArrowLeft=movePrevious (verified in source line 220). The RTL CSS overrides reverse the visual button order, so "Next" appears on the left. This means ArrowRight visually "goes left" which matches "forward in the tour."
   - What's unclear: Whether real Persian-speaking users find this intuitive or confusing.
   - Recommendation: Ship with defaults. If user feedback indicates confusion, swap arrow key behavior using `onNextClick`/`onPrevClick` overrides. LOW priority.

2. **Should `smoothScroll` be enabled?**
   - What we know: Most tour targets are in the main content area and visible without scrolling. The exams toggle and export buttons might be below the fold on small screens.
   - What's unclear: Whether smooth scrolling causes jank on low-end mobile devices.
   - Recommendation: Enable `smoothScroll: true`. It improves UX when targets are off-screen and driver.js handles the animation. Can be disabled if performance issues surface.

## Sources

### Primary (HIGH confidence)
- driver.js v1.4.0 `dist/driver.js.d.ts` — Full type definitions for Config, DriveStep, PopoverDOM, Driver interface
- driver.js v1.4.0 `dist/driver.js.mjs` — Source code analysis: progressText substitution (line 568), onPopoverRender callback (line 295), auto-repositioning logic (lines 360-428), keyboard handling (line 220), allowClose default (line 5)
- Existing codebase: `src/components/onboarding/steps.ts`, `driver-overrides.css`, `src/atoms/index.ts`, `src/App.tsx` data-tour attributes

### Secondary (MEDIUM confidence)
- [Driver.js Configuration docs](https://driverjs.com/docs/configuration) — Config options and defaults
- [Driver.js Tour Progress docs](https://driverjs.com/docs/tour-progress) — progressText template format confirmed
- [Driver.js Theming docs](https://driverjs.com/docs/theming) — CSS class reference for styling
- [Driver.js GitHub Issue #503](https://github.com/kamranahmedse/driver.js/issues/503) — Confirmed onPopoverRender naming (resolved)

### Tertiary (LOW confidence)
- None — all findings verified against source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — driver.js v1.4.0 already installed and verified in Phase 1
- Architecture: HIGH — all patterns verified against actual driver.js v1.4.0 source code and type definitions
- Pitfalls: HIGH — Western digit issue confirmed in source; viewport handling verified in auto-reposition code; DOM availability mitigated by user-action trigger

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (driver.js is stable, low release frequency)
