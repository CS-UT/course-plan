# Phase 2: Welcome Modal - Research

**Researched:** 2026-02-19
**Domain:** React modal carousel, CSS transitions, touch/swipe, RTL carousel, dark mode theming, responsive modal, Jotai state integration
**Confidence:** HIGH

## Summary

Phase 2 builds a custom welcome carousel modal in React + Tailwind CSS (~100-150 LOC as estimated in the roadmap). No new dependencies are needed -- the carousel uses React state for slide index, CSS `transform: translateX()` for slide transitions, and pointer events for optional swipe support. The modal follows the exact same pattern already established by `ManualCourseModal` and `TutorProfileModal` in the codebase (fixed overlay, centered card, bg-black/30 backdrop, z-50, click-outside-to-dismiss).

The key technical considerations are: (1) RTL transform direction -- in RTL, swiping/navigating "next" means translating in the **positive X** direction (right), opposite of LTR convention; (2) respecting the existing `onboardingCompletedAtom` from Phase 1 to gate first-time display; (3) providing a callback mechanism so clicking "Start Tour" can trigger the coach marks tour (Phase 3); and (4) ensuring the modal z-index sits above the app's sticky header (z-40) but works alongside other z-50 modals.

**Primary recommendation:** Build a single `WelcomeModal.tsx` component in `src/components/onboarding/` using React `useState` for slide index, CSS `transform` + `transition` for slide animation, and the existing Jotai `onboardingCompletedAtom` for persistence. No carousel library. No scroll-snap (it adds complexity for a 3-4 slide modal with no benefit over transform-based transitions).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 (useState, useCallback) | ^19.2.0 (already installed) | Slide index state, event handlers | Already the project framework. No hooks library needed for 3-4 slides |
| Tailwind CSS v4 | ^4.1.18 (already installed) | All modal styling, responsive breakpoints, dark mode | Already the project's styling solution |
| Jotai (atomWithStorage) | ^2.17.1 (already installed) | Read/write `onboardingCompletedAtom` | Already used for all persistence. Atom created in Phase 1 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | -- | -- | Zero new dependencies for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React state + CSS transform | CSS scroll-snap | Scroll-snap has native RTL support but adds complexity for a 3-4 slide fixed-size container; new CSS scroll-marker/scroll-button pseudo-elements are Chrome 135+ only (experimental); overkill for this use case |
| React state + CSS transform | Embla Carousel / Swiper | Unnecessary dependency for 3-4 slides; adds bundle size for features not needed (infinite loop, autoplay, lazy loading) |
| Touch events | Pointer events | Pointer events unify mouse+touch but `onPointerDown`/`onPointerMove` require `setPointerCapture` for reliable swipe -- touch events (`onTouchStart`/`onTouchEnd`) are simpler and sufficient for mobile swipe in a modal |
| CSS transform slide | CSS opacity fade | Transform slide feels more natural for a carousel with dot indicators; opacity fade loses the spatial metaphor of "slides" |

**Installation:**
```bash
# No installation needed -- all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    onboarding/
      WelcomeModal.tsx       # NEW: Welcome carousel modal component
      welcomeSlides.ts       # NEW: Pure data file for slide content (Persian headlines + descriptions)
      steps.ts               # EXISTING: Tour step definitions (from Phase 1)
      driver-overrides.css   # EXISTING: driver.js CSS overrides (from Phase 1)
      index.ts               # EXISTING: Barrel export (update to export WelcomeModal)
  atoms/
    index.ts                 # EXISTING: onboardingCompletedAtom (from Phase 1)
```

**Rationale:**
1. **`welcomeSlides.ts` as pure data**: Separates Persian copy from component logic. Same pattern as `steps.ts`. Makes content easy to review and edit without touching component code.
2. **Single `WelcomeModal.tsx` file**: The component is ~100-150 LOC. No need to split into sub-components. The modal, backdrop, slides, dots, and buttons all live in one file.
3. **No separate CSS file**: All styling via Tailwind utility classes + inline `style` for the dynamic `transform`. This matches every other component in the codebase (zero component-level CSS files).

### Pattern 1: Modal with Backdrop (Existing Codebase Pattern)
**What:** Fixed overlay with centered content card, click-outside-to-dismiss.
**When to use:** Every modal in this project follows this exact pattern.
**Example (from ManualCourseModal.tsx, line 60-63):**
```tsx
// Source: src/components/ManualCourseModal.tsx (existing pattern)
<div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
  <div
    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
    onClick={(e) => e.stopPropagation()}
  >
    {/* content */}
  </div>
</div>
```
**Confidence: HIGH** -- Verified from two existing modals in the codebase (`ManualCourseModal.tsx` line 60, `TutorProfileModal.tsx` line 194). Both use identical patterns.

### Pattern 2: Transform-Based Slide Carousel
**What:** A flex container with N slide children, shifted via `transform: translateX()` based on current slide index. CSS `transition` property animates the transform.
**When to use:** For a small number of fixed-width slides (3-4) where scroll-snap is overkill.
**Example:**
```tsx
// Slides container with RTL-aware transform
const slideOffset = currentSlide * 100; // percentage
// In RTL, positive X = "forward" (next slide)
<div
  className="flex transition-transform duration-300 ease-in-out"
  style={{ transform: `translateX(${slideOffset}%)` }}
>
  {slides.map((slide, i) => (
    <div key={i} className="w-full flex-shrink-0">
      {/* slide content */}
    </div>
  ))}
</div>
```
**RTL note:** In RTL layout (`direction: rtl`), the flex container's children flow right-to-left. The first slide is on the right. To go to slide N, translate by `N * 100%` (positive direction), which shifts the container to reveal the Nth child. This is the **opposite** of LTR convention where you'd use negative translateX.

**Confidence: HIGH** -- CSS `transform: translateX()` with `transition` is a standard, widely-used pattern for carousels. RTL direction verified: in `direction: rtl`, flex children flow RTL, so positive translateX moves "forward" through slides.

### Pattern 3: Touch Swipe Detection (Lightweight)
**What:** Track `touchstart` X coordinate and `touchend` X coordinate. If delta exceeds a threshold (e.g., 50px), advance/retreat slide.
**When to use:** Mobile devices. Keep it simple -- no velocity tracking, no drag-follow animation.
**Example:**
```tsx
const touchStartX = useRef(0);

function handleTouchStart(e: React.TouchEvent) {
  touchStartX.current = e.touches[0].clientX;
}

function handleTouchEnd(e: React.TouchEvent) {
  const delta = e.changedTouches[0].clientX - touchStartX.current;
  const threshold = 50;
  // RTL: swipe left (negative delta) = next, swipe right (positive delta) = previous
  if (delta < -threshold) goToNext();
  if (delta > threshold) goToPrev();
}
```
**RTL swipe direction:** In RTL, content flows right-to-left. Swiping LEFT (finger moves left, delta negative) naturally means "go forward/next." Swiping RIGHT means "go back." This is the same physical gesture direction as LTR carousels -- the semantic meaning inverts but the finger direction stays the same because the content direction is already reversed.

**Confidence: HIGH** -- Touch events API is stable and well-documented (MDN). Swipe threshold pattern is standard.

### Pattern 4: Dot Indicators with Active State
**What:** A row of small circles below the slides. The active slide's dot is highlighted.
**When to use:** Standard carousel UI pattern for 3-4 slides.
**Example:**
```tsx
<div className="flex justify-center gap-2 mt-4">
  {slides.map((_, i) => (
    <button
      key={i}
      onClick={() => setCurrentSlide(i)}
      className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
        i === currentSlide
          ? 'bg-primary-500'
          : 'bg-gray-300 dark:bg-gray-600'
      }`}
    />
  ))}
</div>
```
**Confidence: HIGH** -- Standard UI pattern. Follows project conventions (rounded, primary-500 active, gray-300 inactive, dark mode variants, transition-colors, cursor-pointer).

### Pattern 5: Slide Content Data File
**What:** Pure data array of slide objects with Persian text. No component imports, no JSX.
**When to use:** Separates content from layout, matching the `steps.ts` pattern from Phase 1.
**Example:**
```typescript
// src/components/onboarding/welcomeSlides.ts
export interface WelcomeSlide {
  id: string;
  title: string;       // Persian headline
  description: string; // Persian description (1-2 sentences)
  icon: string;        // Emoji or simple text icon (no SVG/image deps)
}

export const welcomeSlides: WelcomeSlide[] = [
  {
    id: 'search',
    title: 'جستجو و انتخاب درس',
    description: 'دروس را جستجو کنید و با یک کلیک به برنامه هفتگی‌تان اضافه کنید.',
    icon: '🔍',
  },
  {
    id: 'schedule',
    title: 'برنامه هفتگی هوشمند',
    description: 'تداخل ساعت و امتحان به صورت خودکار شناسایی می‌شود.',
    icon: '📅',
  },
  {
    id: 'compare',
    title: 'مقایسه برنامه‌ها',
    description: 'تا ۵ برنامه مختلف بسازید و بهترین را انتخاب کنید.',
    icon: '📊',
  },
  {
    id: 'export',
    title: 'خروجی و اشتراک‌گذاری',
    description: 'برنامه را به صورت تصویر ذخیره کنید یا لینک تقویم گوگل بسازید.',
    icon: '📤',
  },
];
```
**Content note:** The 4 slides cover the app's key differentiating features: search+add, conflict detection, multi-schedule comparison, and export/share. These match the tour steps from Phase 1 but at a higher level (features, not UI elements). The Persian text is concise and natural. Icons use emoji for zero-dependency simplicity; the roadmap's v2 requirement (VPOL-01) defers SVG illustrations to a future release.

**Confidence: HIGH** -- Content coverage verified against requirements WELC-01 (3-4 slides) and WELC-02 (Persian headline + description per slide). Pattern matches existing `steps.ts` data file.

### Anti-Patterns to Avoid

- **NEVER use a carousel library for 3-4 slides:** Libraries like Embla, Swiper, or pure-react-carousel add 10-30kb for features not needed (infinite loop, autoplay, lazy loading, virtual slides). The entire modal is ~100 LOC with pure React.

- **NEVER use CSS scroll-snap for a modal carousel:** Scroll-snap is designed for scrollable overflow containers. In a fixed-size modal with known slide count, `transform: translateX()` is simpler, more predictable, and gives direct control over the animation.

- **NEVER add entry/exit animations to the modal backdrop:** The existing modals in the codebase (`ManualCourseModal`, `TutorProfileModal`, `MobileCourseSearch`) all mount/unmount without fade animations. Adding one to only the welcome modal would be inconsistent. Keep it simple: conditional render, no animate.

- **NEVER use `useEffect` to auto-advance slides:** The requirements explicitly exclude auto-advancing (Out of Scope in REQUIREMENTS.md: "Auto-advancing slides -- Users read at different speeds; manual navigation only").

- **NEVER store the current slide index in localStorage/atoms:** The slide index is ephemeral UI state. Only the "onboarding completed" boolean persists. If the user refreshes mid-modal, they see slide 0 again -- which is fine.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal backdrop + centering | Custom portal, custom z-index manager | Existing `fixed inset-0 z-50 bg-black/30 flex items-center justify-center` pattern | Already used by 2 other modals. Consistent UX. |
| Body scroll lock | Custom `overflow: hidden` on body | Nothing (not needed) | The modal has `bg-black/30` backdrop. Existing modals don't lock scroll and it works fine. Keep consistent. |
| Keyboard navigation (Escape to close) | Custom `useEffect` with `keydown` listener | Simple `onKeyDown` on the backdrop div | Same approach could work, but since existing modals don't handle Escape, keep consistent. Escape handling is for the tour (Phase 3/driver.js), not the welcome modal. |
| Focus trap | Custom focus trap implementation | Nothing (not needed for 3-4 slides with 2 buttons) | Focus traps matter for complex forms. A welcome modal with Skip/Next/Start Tour doesn't need it. Over-engineering. |

**Key insight:** The welcome modal is a simple, ephemeral component. It appears once for first-time users, shows 3-4 slides, and either launches the tour or gets dismissed. Simplicity trumps accessibility theater for a component users interact with for 10-20 seconds.

## Common Pitfalls

### Pitfall 1: RTL Transform Direction Reversed
**What goes wrong:** Slides appear to move in the wrong direction when clicking Next/Previous. Clicking "Next" shows the previous slide.
**Why it happens:** In LTR, `translateX(-100%)` moves to slide 2. In RTL (`direction: rtl`), the flex children are reversed, so `translateX(-100%)` moves backward. Developers copy LTR carousel code without adjusting for RTL.
**How to avoid:** In RTL, use **positive** `translateX` to go forward. `translateX(currentSlide * 100%)` moves forward through slides. Test by clicking Next and verifying the slide content matches expectations.
**Warning signs:** Dot indicators show slide 2 but slide 0 content is visible. Swipe direction feels inverted.

### Pitfall 2: Z-Index Conflict with Existing Modals
**What goes wrong:** Welcome modal appears behind the sticky header (z-40) or conflicts with other z-50 elements.
**Why it happens:** Multiple elements using `z-50` can stack unpredictably. The mobile FAB button also uses `z-50`.
**How to avoid:** Use the same `z-50` as existing modals. The welcome modal shows on first visit before the user interacts with anything, so no other modal will be open simultaneously. The `fixed inset-0` backdrop covers the FAB. No z-index conflict in practice.
**Warning signs:** Header visible through/above the modal backdrop. FAB button floating on top of the modal.

### Pitfall 3: Modal Content Overflow on Small Mobile Screens
**What goes wrong:** On very small screens (320px wide, older iPhones), the modal content overflows or buttons are cut off.
**Why it happens:** Fixed `max-w-md` (448px) with `p-4` padding leaves little room on 320px screens. `max-w-md` is fine because it's a max, but internal padding + content height can overflow vertically.
**How to avoid:** Use `max-w-sm` (384px) or `max-w-md` for the card, `p-4` on the backdrop (existing pattern), and ensure vertical content fits in `max-h-[90vh]` with `overflow-y-auto`. Keep slide content concise (title + 1-2 line description + icon). Test at 320px viewport width.
**Warning signs:** Buttons below the fold. Dot indicators hidden. Need to scroll inside the modal.

### Pitfall 4: Touch Swipe Interfering with Vertical Scroll
**What goes wrong:** User tries to scroll the page but the swipe handler captures the touch event and changes slides instead.
**Why it happens:** The `touchmove` event fires on any touch movement. Without checking if the gesture is primarily horizontal vs. vertical, any touch on the modal triggers slide navigation.
**How to avoid:** Only detect swipe on `touchstart` + `touchend` (not `touchmove`). Check X delta only. If using `touchmove`, add a check: only count as horizontal swipe if `|deltaX| > |deltaY| * 2`. But since the modal content is short (no scrolling needed), using just start/end is simpler.
**Warning signs:** Slides change when user tries to scroll or tap buttons.

### Pitfall 5: Forgetting to Mark Onboarding Complete on Skip
**What goes wrong:** User clicks "Skip" but sees the welcome modal again on next visit.
**Why it happens:** Developer only sets `onboardingCompletedAtom` to `true` in the "Start Tour" path, forgetting the "Skip" path.
**How to avoid:** Both "Skip" and "Start Tour" must set `onboardingCompletedAtom` to `true` before dismissing the modal. The atom value determines whether the modal shows on next visit.
**Warning signs:** Clicking "Skip" hides the modal but refreshing the page shows it again.

## Code Examples

Verified patterns from the codebase and standard React patterns:

### WelcomeModal Component Skeleton
```tsx
// src/components/onboarding/WelcomeModal.tsx
import { useState, useRef, useCallback } from 'react';
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
    if (delta < -50) goToSlide(currentSlide + 1); // Swipe left = next (in both LTR and RTL physical gesture)
    if (delta > 50) goToSlide(currentSlide - 1);  // Swipe right = prev
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
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
              <div key={slide.id} className="w-full flex-shrink-0 p-6 text-center">
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
```

**Source:** Modal structure from `ManualCourseModal.tsx` (line 60-63). Button styling from `ManualCourseModal.tsx` (line 358-361). Color tokens from `src/index.css` theme. Atom usage from `src/atoms/index.ts`.

**Key design decisions in the skeleton:**
- `max-w-sm` (384px) instead of `max-w-md` for a tighter, more polished modal on mobile
- `overflow-hidden` on the card (not `overflow-y-auto`) because slides are short and don't need scroll
- `p-6` on each slide for generous padding inside the carousel area
- Buttons are in a persistent footer (not per-slide) for consistent interaction
- "Skip" is always visible, "Start Tour" appears on last slide, "Next" on other slides
- The backdrop does NOT have `onClick={handleSkip}` -- clicking outside should not dismiss, since this is an intentional first-time experience (different from form modals where dismissing loses no data)

### RTL Transform Direction Verification
```tsx
// In RTL (direction: rtl), flex container children flow right-to-left:
// [Slide 3] [Slide 2] [Slide 1] [Slide 0]  <- visual order
//
// Slide 0 is at translateX(0%) - rightmost, visible by default
// Slide 1 is at translateX(100%) - need to shift container right to reveal
// Slide 2 is at translateX(200%) - shift further right
//
// So: transform: translateX(currentSlide * 100%)  (POSITIVE for RTL)
//
// For LTR it would be: transform: translateX(-currentSlide * 100%)  (NEGATIVE)
```

### Barrel Export Update
```typescript
// src/components/onboarding/index.ts (updated)
export { tourSteps } from './steps';
export type { TourStepDef } from './steps';
export { WelcomeModal } from './WelcomeModal';
export { welcomeSlides } from './welcomeSlides';
export type { WelcomeSlide } from './welcomeSlides';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery carousel plugins (Slick, Owl) | React state + CSS transform | React era (2016+) | No jQuery dependency; simpler mental model with React state |
| CSS scroll-snap basic | CSS scroll-snap with ::scroll-button/::scroll-marker pseudo-elements | Chrome 135 (2025) | Experimental; cannot use in production yet (no Firefox/Safari) |
| Touch event separate handlers | Pointer Events API (unified mouse+touch) | 2020+ | Pointer events are the modern standard but add complexity (setPointerCapture); for a simple swipe in a modal, touch events remain simpler |
| Library carousels (react-slick, react-responsive-carousel) | Headless/minimal carousels (Embla) or no-library | 2023+ | Trend toward zero-dependency for simple use cases; libraries reserved for complex requirements |

**Deprecated/outdated:**
- `react-responsive-carousel`: Last meaningful update 2022. Not React 19 compatible.
- `react-slick`: jQuery dependency. Not recommended for modern React.
- CSS `::scroll-button()` and `::scroll-marker()`: Chrome 135+ only (experimental, Feb 2025). Not production-ready in Feb 2026.

## Open Questions

1. **"Start Tour" button on every slide vs. last slide only**
   - What we know: The requirements say "User can click 'Start Tour' on the last slide (or any slide)." This is ambiguous -- does "or any slide" mean the button should appear on all slides?
   - What's unclear: Whether showing "Start Tour" on every slide clutters the UI or is expected.
   - Recommendation: Show "Next" button on slides 0 through N-2, and "Start Tour" on the last slide (N-1). Add "Start Tour" as a secondary action accessible from any slide via a text link or small button. This keeps the primary flow clean (Next -> Next -> Start Tour) while allowing power users to skip ahead. But keep it simple -- if showing "Start Tour" on every slide alongside "Next" is too cluttered, just show it on the last slide. The planner should decide.

2. **Touch swipe direction in RTL physical vs. logical**
   - What we know: In RTL layouts, swiping LEFT physically (finger moves left) should navigate "forward" to the next slide, same as in LTR. The visual flow is reversed but the physical gesture stays the same.
   - What's unclear: Whether some RTL-native users expect the opposite (swipe right = next, because Arabic/Persian text reads right-to-left).
   - Recommendation: Use the standard physical gesture: swipe left = next, swipe right = prev. This is what all major RTL apps (Twitter, Instagram) do. The CSS `direction: rtl` already handles the visual reversal. If user feedback says otherwise, it's a one-line change.

3. **Whether the welcome modal should block clicking outside to dismiss**
   - What we know: Other modals in the codebase (`ManualCourseModal`, `TutorProfileModal`) dismiss on backdrop click. The requirements say users can "Skip" to dismiss.
   - What's unclear: Should backdrop click also dismiss? For a first-time onboarding modal, accidentally clicking outside would lose the onboarding opportunity.
   - Recommendation: Do NOT dismiss on backdrop click. The welcome modal is intentional first-time content. Require explicit "Skip" or "Start Tour" button click. This differs from other modals but serves the onboarding goal better.

## Sources

### Primary (HIGH confidence)
- Barname codebase analysis -- `src/components/ManualCourseModal.tsx`, `src/components/TutorProfileModal.tsx` (existing modal patterns), `src/App.tsx` (z-index usage, responsive breakpoints), `src/index.css` (design tokens, dark mode), `src/atoms/index.ts` (onboardingCompletedAtom), `src/components/onboarding/` (Phase 1 infrastructure)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events) -- touchstart/touchend API for swipe detection
- [MDN CSS transform](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) -- translateX() for slide transitions
- [MDN CSS transition](https://developer.mozilla.org/en-US/docs/Web/CSS/transition) -- transition-property duration timing

### Secondary (MEDIUM confidence)
- [MDN CSS Scroll-Snap Carousels](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Overflow/Carousels) -- Evaluated and rejected: experimental pseudo-elements (scroll-button, scroll-marker) not production-ready
- RTL carousel transform direction -- Verified by reasoning about CSS `direction: rtl` flex layout behavior. Flex children reverse, so positive translateX = forward.

### Tertiary (LOW confidence)
- Swipe gesture direction convention in RTL -- Based on observation of major RTL apps (not formally verified with RTL UX research). Standard practice: physical swipe left = next in both LTR and RTL.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies. All tools are already in the project.
- Architecture: HIGH -- Follows exact patterns from existing codebase (modal structure, data files, atoms, barrel exports).
- Pitfalls: HIGH -- RTL transform direction verified by CSS spec reasoning. Z-index verified from codebase grep. Touch swipe is standard web API.
- Code examples: HIGH -- Modal pattern directly from existing components. Tailwind classes from existing codebase conventions.

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (no external dependencies to go stale; all patterns are stable web standards)
