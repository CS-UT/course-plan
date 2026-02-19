# Phase 1: Foundation - Research

**Researched:** 2026-02-19
**Domain:** driver.js installation, CSS theming (dark mode + RTL), Jotai persistence atoms, project structure, tour step data file, data-tour attributes
**Confidence:** HIGH

## Summary

Phase 1 establishes all technical infrastructure for the onboarding feature: installing driver.js, creating CSS overrides for dark mode and RTL, defining Jotai persistence atoms, setting up the project structure under `src/components/onboarding/`, creating a pure data file for tour step definitions, and adding `data-tour` attributes to existing components.

The research confirms driver.js v1.4.0 is the correct choice. It has zero dependencies, is ~5kb gzipped, MIT-licensed, and framework-agnostic (no React version coupling). The main technical challenges are: (1) CSS import ordering with Tailwind CSS v4's cascade layers, (2) RTL overrides for popover layout, (3) dynamic import strategy for CSS alongside JS, and (4) correct arrow color overrides for dark mode across all four popover placement directions.

**Primary recommendation:** Import driver.js CSS statically in the override CSS file (not dynamically), use plain CSS overrides (not Tailwind layers) for driver.js theming, and structure onboarding code as a self-contained module under `src/components/onboarding/`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
No locked decisions -- all implementation decisions for this phase are at Claude's discretion.

### Claude's Discretion
All implementation decisions for this phase are at Claude's discretion:
- Popover visual styling (colors, borders, shape) in light and dark modes -- match existing app design tokens
- Persian copy for tour step titles/descriptions and carousel slide headlines -- write concise, natural Persian
- Target elements, order, and mobile filtering -- follow research recommendations (7 elements across 5 files)
- Persistence atom naming and versioning -- follow existing Jotai patterns in the codebase
- CSS override specifics for RTL layout -- follow research findings, test visually
- Project structure within src/components/onboarding/ -- follow research architecture recommendations

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| driver.js | ^1.4.0 | Step-by-step spotlight tour engine | Only viable MIT-licensed tour library compatible with React 19. Zero dependencies, ~5kb gzipped, 22k+ GitHub stars. Framework-agnostic (no React peer dep) |
| Jotai (atomWithStorage) | ^2.17.1 (already installed) | Persist onboarding completion state to localStorage | Already used for all persistent state in the app (`plan-schedules`, `plan-currentScheduleId`). No new dependency |
| Tailwind CSS v4 | ^4.1.18 (already installed) | Style custom onboarding components | Already the project's styling solution |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | -- | -- | All supporting functionality comes from existing project dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| driver.js | react-joyride | Broken with React 19 (uses removed `unmountComponentAtNode` API). No stable fix. |
| driver.js | @reactour/tour | React 19 fix merged May 2025 but never published to npm. Last npm release 2022. Effectively abandoned. |
| driver.js | shepherd.js | AGPL-3.0 license. 5x larger (~25kb). Requires commercial license. |
| driver.js | intro.js | AGPL license. Requires paid license ($9.99+). |
| driver.js | Build from scratch with @floating-ui/react | 5-10x more work. Must build spotlight, scroll, navigation manually. 2kb savings not worth days of work. |

**Installation:**
```bash
npm install driver.js
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── onboarding/
│       ├── steps.ts              # Pure data: tour step definitions (selectors, Persian text, placement, device)
│       ├── driver-overrides.css  # Dark mode + RTL CSS overrides for driver.js
│       └── index.ts              # Public barrel export (placeholder for later phases)
├── atoms/
│   └── index.ts                  # Add onboarding atoms alongside existing schedule atoms
```

**Rationale for structure decisions:**

1. **`driver-overrides.css` inside `onboarding/`** (not `src/styles/`): The project has no `src/styles/` directory. All CSS is in `src/index.css`. Keeping the override file with the onboarding module makes the feature self-contained and deletable as a unit.

2. **`steps.ts` as pure data file**: Separates "what to show" from "how to show it." Each step is a plain object with target selector, title, description, placement, and device flag. No imports, no side effects, trivially testable.

3. **Atoms in existing `atoms/index.ts`**: The project has a single atoms file. Adding 1-2 atoms here follows the established convention rather than creating a new file.

4. **No component files in Phase 1**: Phase 1 creates infrastructure only. `CoachMarks.tsx`, `WelcomeModal.tsx`, and `HelpButton.tsx` are Phase 2-4 deliverables.

### Pattern 1: Static CSS Import for driver.js (Not Dynamic)

**What:** Import `driver.js/dist/driver.css` statically via `@import` in the overrides CSS file, rather than dynamically via `await import()`.

**When to use:** Always. This is the recommended approach for this project.

**Why:** Dynamic CSS imports (`await import('driver.js/dist/driver.css')`) are unreliable in Vite production builds. Vite processes CSS differently in dev (HMR injection) vs. production (extracted to static files). Dynamic CSS import works in dev but can fail in production -- a well-documented issue (vitejs/vite#4237, vitejs/vite#16735, vitejs/vite#14700). The CSS file is ~2kb, which is negligible compared to font loading and course data.

**The dynamic import strategy for the JS module remains valid:** `const { driver } = await import('driver.js')` works correctly because Vite handles JS dynamic imports properly via code splitting. Only the CSS import should be static.

**Implementation:**
```css
/* src/components/onboarding/driver-overrides.css */
@import "driver.js/dist/driver.css";

/* Dark mode overrides */
.dark .driver-popover { ... }

/* RTL overrides */
[dir="rtl"] .driver-popover { ... }
```

Then import this single CSS file in `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap');
@import "./components/onboarding/driver-overrides.css";
@import "tailwindcss";
```

**Confidence: HIGH** -- Verified via Vite GitHub issues (vitejs/vite#4237, #14700, #16735) and Vite official docs. Static CSS import is the only reliable approach in Vite production builds.

### Pattern 2: Tailwind CSS v4 Layer Interaction

**What:** Tailwind CSS v4 uses native CSS cascade layers (`@layer theme`, `@layer base`, `@layer utilities`). Unlayered CSS has higher specificity than all layered CSS.

**When to use:** Understanding this is critical for CSS override strategy.

**Why it matters:** Since driver.js CSS and our custom overrides are NOT inside any `@layer`, they automatically have higher specificity than Tailwind's layered utilities. This means:
- driver.js default styles will render correctly (not overridden by Tailwind reset)
- Our dark mode / RTL overrides will work without needing `!important`
- No CSS layer conflicts to worry about

**Import order in `src/index.css`:**
```css
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap');
@import "./components/onboarding/driver-overrides.css";  /* Unlayered: higher specificity */
@import "tailwindcss";  /* Layered: lower specificity */
```

The import order matters less than the layer/unlayer distinction, but placing overrides before Tailwind keeps the file organized logically.

**Confidence: HIGH** -- Verified via Tailwind CSS v4 documentation and GitHub discussions (tailwindlabs/tailwindcss#13188). Tailwind v4 confirmed to use native cascade layers.

### Pattern 3: Jotai atomWithStorage with Versioned Key

**What:** Use `atomWithStorage` with a versioned key name following the existing project convention.

**Existing pattern in codebase:**
```typescript
// src/atoms/index.ts (existing)
export const schedulesAtom = atomWithStorage<Schedule[]>('plan-schedules', [{ id: 0, courses: [] }]);
export const currentScheduleIdAtom = atomWithStorage<number>('plan-currentScheduleId', 0);
```

**New atom:**
```typescript
// Added to src/atoms/index.ts
export const onboardingCompletedAtom = atomWithStorage<boolean>('plan-onboarding-v1', false);
```

**Key design decisions:**
- Prefix: `plan-` (matches existing `plan-schedules`, `plan-currentScheduleId`, `plan-dark-mode`)
- Version suffix: `-v1` (enables future reset by bumping to `-v2`)
- Type: `boolean` (simple completed/not-completed; no need for complex state in Phase 1)
- Default: `false` (new users have not completed onboarding)

**Confidence: HIGH** -- Follows exact pattern from existing codebase. Jotai `atomWithStorage` API verified from project's own usage.

### Pattern 4: data-tour Attribute Convention

**What:** Add `data-tour="identifier"` attributes to existing component wrapper elements as stable selectors for driver.js steps.

**Why data-tour instead of CSS selectors:**
- CSS classes can change (Tailwind utility refactoring)
- IDs may conflict or be removed
- `data-tour` attributes have zero behavioral impact and explicitly signal "this element is a tour target"
- driver.js accepts any CSS selector, so `[data-tour="course-search"]` works directly

**Target elements (7 attributes across 5 files):**

| Attribute | Element | File | Line Context | Device |
|-----------|---------|------|-------------|--------|
| `data-tour="course-search"` | `<div>` wrapper of CourseSearch sidebar | `src/components/CourseSearch.tsx` | Outermost `<div className="flex flex-col gap-3">` | Desktop |
| `data-tour="mobile-add-btn"` | Mobile FAB button `"+ افزودن درس"` | `src/App.tsx` | `<button className="fixed bottom-5 right-4 bg-primary-600..."` | Mobile |
| `data-tour="calendar"` | Calendar wrapper `<div>` | `src/components/WeeklySchedule.tsx` | Outermost `<div className="bg-white dark:bg-gray-800 rounded-xl...">` | Both |
| `data-tour="schedule-tabs"` | Tab bar wrapper `<div>` | `src/components/ScheduleTabs.tsx` | Outermost `<div className="flex items-center gap-2 flex-wrap">` | Both |
| `data-tour="export-buttons"` | Export buttons wrapper `<div>` | `src/components/ExportButtons.tsx` | Outermost `<div className="flex items-center gap-1.5">` | Both |
| `data-tour="exams-toggle"` | Exams toggle button | `src/App.tsx` | `<button onClick={() => setShowExams(...)}>` | Both |
| `data-tour="dark-mode"` | Dark mode toggle button | `src/App.tsx` | `<button onClick={toggleDark}>` | Both |

**Confidence: HIGH** -- All target elements identified by reading actual source code. Elements are stable wrappers, not third-party library internals.

### Anti-Patterns to Avoid

- **NEVER target FullCalendar internal elements** (`.fc-timegrid-slot`, `.fc-event`, `.fc-col-header-cell`): FullCalendar manages its own DOM. Internal class names are not a stable API. The transposed calendar has entirely different DOM structure. Always target the wrapper `<div>` with `data-tour="calendar"`.

- **NEVER dynamically import CSS in Vite production**: `await import('driver.js/dist/driver.css')` fails in Vite production builds. Always use static `@import` for CSS.

- **NEVER put driver.js overrides inside a Tailwind `@layer`**: Tailwind's cascade layers have lower specificity than unlayered CSS. Putting overrides in a layer would make them weaker than driver.js defaults, defeating the purpose.

- **NEVER use `!important` for driver.js overrides**: Since both driver.js CSS and our overrides are unlayered, normal CSS specificity rules apply. Our selectors (`.dark .driver-popover`) are more specific than driver.js defaults (`.driver-popover`), so `!important` is unnecessary.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tour spotlight overlay | Custom SVG mask or box-shadow overlay | driver.js built-in overlay | driver.js handles overlay rendering, z-index management, animated transitions, and click-through protection |
| Tooltip positioning | Custom positioning with `getBoundingClientRect()` | driver.js built-in positioning | Handles viewport edge detection, scroll offset, resize, and arrow alignment automatically |
| Step navigation state machine | Custom prev/next/skip state management | driver.js internal state | driver.js manages step index, button state, keyboard navigation internally. Do not duplicate in React state |
| CSS dark mode detection | Custom JS-based theme detection for driver.js | CSS selector `.dark .driver-popover` | The `.dark` class is already on `<html>` element. CSS selectors handle theme automatically without JS |

**Key insight:** driver.js is an all-in-one engine. Phase 1 only needs to configure its appearance via CSS, not replicate any of its functionality.

## Common Pitfalls

### Pitfall 1: CSS Import Order Breaks driver.js Styles
**What goes wrong:** driver.js popovers render without backgrounds, borders, or proper spacing because Tailwind's preflight/reset overrides driver.js defaults.
**Why it happens:** If driver.js CSS is imported after `@import "tailwindcss"`, or if it somehow ends up inside a Tailwind layer, Tailwind's normalization styles may strip driver.js formatting.
**How to avoid:** Import `driver-overrides.css` (which internally `@import`s `driver.js/dist/driver.css`) BEFORE `@import "tailwindcss"` in `src/index.css`. Since both driver.js CSS and overrides are unlayered, they will have higher specificity than Tailwind's layered styles.
**Warning signs:** Popover appears as plain text without a card/box appearance. Buttons render as unstyled links.
**Confidence: HIGH** -- Verified via Tailwind v4 cascade layer behavior (tailwindlabs/tailwindcss#13188).

### Pitfall 2: RTL Popover Layout Broken Out of the Box
**What goes wrong:** driver.js popovers render with LTR text alignment, LTR button order (Previous on left, Next on right), and LTR close button positioning. Navigation buttons are backwards for Persian users.
**Why it happens:** driver.js has no built-in RTL support. An open PR (#569) exists since May 2025 but has not been merged as of Feb 2026.
**How to avoid:** Apply RTL CSS overrides in `driver-overrides.css` from day one. Use `[dir="rtl"]` selector (matches the project's `<html dir="rtl">` attribute). Override text-align, flex-direction for navigation buttons, and close button position.
**Warning signs:** "Next" button appears where "Previous" should be for RTL users. Text reads correctly but visual flow feels wrong.
**Confidence: HIGH** -- Verified via driver.js GitHub PR #569 and the project's `index.html` which sets `dir="rtl"` on `<html>`.

### Pitfall 3: Dark Mode Arrow Colors Missing
**What goes wrong:** Popover body has correct dark background, but arrows remain white (the default color), creating a visual mismatch between the arrow and the popover card.
**Why it happens:** driver.js arrows are CSS borders (not background colors). Each arrow direction uses a different border side. Developers often override the popover background but forget the arrow borders.
**How to avoid:** Override all four arrow direction classes in dark mode:
- `.driver-popover-arrow-side-top` -- uses `border-bottom-color`
- `.driver-popover-arrow-side-bottom` -- uses `border-top-color`
- `.driver-popover-arrow-side-left` -- uses `border-right-color`
- `.driver-popover-arrow-side-right` -- uses `border-left-color`
**Warning signs:** Arrow tip is white while popover card is dark slate. Easy to miss if only testing one popover placement direction.
**Confidence: HIGH** -- Verified from driver.js source CSS. Arrow classes confirmed: `.driver-popover-arrow-side-top`, `.driver-popover-arrow-side-bottom`, `.driver-popover-arrow-side-left`, `.driver-popover-arrow-side-right`.

### Pitfall 4: Dynamic CSS Import Fails in Production
**What goes wrong:** `await import('driver.js/dist/driver.css')` works in Vite dev server but fails silently in production build, resulting in unstyled popovers.
**Why it happens:** Vite handles CSS differently in dev (HMR style injection) vs production (extraction to static files). Dynamic CSS imports are not reliably supported in production.
**How to avoid:** Use static `@import` for CSS. Only dynamically import the JS module: `const { driver } = await import('driver.js')`.
**Warning signs:** Popovers look correct in `npm run dev` but appear unstyled after `npm run build && npm run preview`.
**Confidence: HIGH** -- Verified via multiple Vite GitHub issues (vitejs/vite#4237, #14700, #16735).

### Pitfall 5: Vazirmatn Font Not Applied to Popovers
**What goes wrong:** driver.js popovers render in the browser default sans-serif font instead of Vazirmatn, breaking the all-Persian visual consistency.
**Why it happens:** driver.js creates its own DOM elements outside the React component tree. Its CSS sets `font-family` on `.driver-popover`. Unless overridden, it uses the driver.js default font stack.
**How to avoid:** Add `font-family: "Vazirmatn", system-ui, sans-serif;` to the `.driver-popover` override in `driver-overrides.css`. This matches the project's `--font-sans` theme variable.
**Warning signs:** Popover text looks subtly different from the rest of the app (different letter shapes, spacing, weight).
**Confidence: HIGH** -- driver.js creates DOM outside React tree, confirmed from architecture research and official docs.

## Code Examples

Verified patterns from official sources and codebase analysis:

### CSS Override File (driver-overrides.css)
```css
/* src/components/onboarding/driver-overrides.css */

/* Import driver.js base styles */
@import "driver.js/dist/driver.css";

/* ─── Font: Match app's Vazirmatn ─── */
.driver-popover {
  font-family: "Vazirmatn", system-ui, sans-serif;
}

/* ─── Dark Mode ─── */
/* Project uses .dark class on <html>, matching @custom-variant dark */

.dark .driver-popover {
  background-color: #1e293b;  /* slate-800 — matches dark:bg-gray-800 */
  color: #e2e8f0;             /* slate-200 */
}

.dark .driver-popover-title {
  color: #f1f5f9;             /* slate-100 */
}

.dark .driver-popover-description {
  color: #cbd5e1;             /* slate-300 */
}

.dark .driver-popover-close-btn {
  color: #94a3b8;             /* slate-400 */
}

.dark .driver-popover-footer .driver-popover-progress-text {
  color: #94a3b8;             /* slate-400 */
}

/* Navigation buttons */
.dark .driver-popover-navigation-btns button {
  background-color: transparent;
  color: #94a3b8;             /* slate-400 */
  border-color: #475569;      /* slate-600 */
}

/* Next/Done button — primary action */
.dark .driver-popover-navigation-btns .driver-popover-next-btn {
  background-color: #3b82f6;  /* blue-500 — matches app primary-500 */
  color: white;
  border-color: #3b82f6;
}

/* Arrow colors for each direction */
.dark .driver-popover-arrow-side-top {
  border-bottom-color: #1e293b;
}

.dark .driver-popover-arrow-side-bottom {
  border-top-color: #1e293b;
}

.dark .driver-popover-arrow-side-left {
  border-right-color: #1e293b;
}

.dark .driver-popover-arrow-side-right {
  border-left-color: #1e293b;
}

/* ─── RTL Layout ─── */
/* Project sets dir="rtl" on <html> */

[dir="rtl"] .driver-popover {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .driver-popover-footer {
  flex-direction: row-reverse;
}

[dir="rtl"] .driver-popover-navigation-btns {
  flex-direction: row-reverse;
}

[dir="rtl"] .driver-popover-close-btn {
  left: unset;
  right: 8px;
}

[dir="rtl"] .driver-popover-progress-text {
  direction: rtl;
}
```
**Source:** driver.js CSS class names verified from [driver.js source CSS](https://github.com/kamranahmedse/driver.js/blob/master/src/driver.css). Dark mode colors match project's existing design tokens in `src/index.css`. RTL approach based on project's `<html dir="rtl">` in `index.html`.

### Jotai Persistence Atom
```typescript
// Added to src/atoms/index.ts
export const onboardingCompletedAtom = atomWithStorage<boolean>('plan-onboarding-v1', false);
```
**Source:** Pattern from existing `src/atoms/index.ts` which uses `atomWithStorage` with `plan-` prefix.

### Tour Step Definitions (steps.ts)
```typescript
// src/components/onboarding/steps.ts
export interface TourStepDef {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  device: 'desktop' | 'mobile' | 'both';
}

export const tourSteps: TourStepDef[] = [
  {
    id: 'course-search',
    targetSelector: '[data-tour="course-search"]',
    title: 'جستجوی درس',
    description: 'از اینجا دروس مورد نظرتان را جستجو کنید و به برنامه اضافه کنید.',
    side: 'left',
    align: 'start',
    device: 'desktop',
  },
  {
    id: 'mobile-add',
    targetSelector: '[data-tour="mobile-add-btn"]',
    title: 'افزودن درس',
    description: 'برای جستجو و افزودن درس، اینجا را لمس کنید.',
    side: 'top',
    align: 'center',
    device: 'mobile',
  },
  {
    id: 'calendar',
    targetSelector: '[data-tour="calendar"]',
    title: 'برنامه هفتگی',
    description: 'برنامه هفتگی شما اینجا نمایش داده می‌شود. روی خانه‌های خالی بکشید تا دروس آن ساعت فیلتر شوند.',
    side: 'top',
    align: 'center',
    device: 'both',
  },
  {
    id: 'schedule-tabs',
    targetSelector: '[data-tour="schedule-tabs"]',
    title: 'برنامه‌های متعدد',
    description: 'می‌توانید تا ۵ برنامه مختلف بسازید و مقایسه کنید.',
    side: 'bottom',
    align: 'start',
    device: 'both',
  },
  {
    id: 'exams-toggle',
    targetSelector: '[data-tour="exams-toggle"]',
    title: 'جدول امتحانات',
    description: 'جدول امتحانات و تداخل‌ها را اینجا ببینید.',
    side: 'bottom',
    align: 'start',
    device: 'both',
  },
  {
    id: 'export-buttons',
    targetSelector: '[data-tour="export-buttons"]',
    title: 'خروجی و اشتراک‌گذاری',
    description: 'برنامه را به صورت تصویر، فایل JSON یا لینک تقویم گوگل خروجی بگیرید.',
    side: 'bottom',
    align: 'end',
    device: 'both',
  },
  {
    id: 'dark-mode',
    targetSelector: '[data-tour="dark-mode"]',
    title: 'حالت تاریک',
    description: 'با این دکمه بین حالت روشن و تاریک جابه‌جا شوید.',
    side: 'bottom',
    align: 'end',
    device: 'both',
  },
];
```
**Source:** Target selectors match the `data-tour` attribute plan from codebase analysis. Persian copy written for natural, concise guidance text.

### data-tour Attribute Placement
```tsx
// CourseSearch.tsx — outermost div
<div className="flex flex-col gap-3" data-tour="course-search">

// App.tsx — mobile FAB button
<button data-tour="mobile-add-btn" className="fixed bottom-5 right-4 bg-primary-600...">

// WeeklySchedule.tsx — outermost div
<div data-tour="calendar" className="bg-white dark:bg-gray-800 rounded-xl...">

// ScheduleTabs.tsx — outermost div
<div data-tour="schedule-tabs" className="flex items-center gap-2 flex-wrap">

// ExportButtons.tsx — outermost div
<div data-tour="export-buttons" className="flex items-center gap-1.5">

// App.tsx — exams toggle button
<button data-tour="exams-toggle" onClick={() => setShowExams((v) => !v)}>

// App.tsx — dark mode toggle button
<button data-tour="dark-mode" onClick={toggleDark}>
```
**Source:** All elements identified from reading actual component source files.

### CSS Import in index.css
```css
/* src/index.css — updated import order */
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap');
@import "./components/onboarding/driver-overrides.css";
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
/* ... rest of existing styles ... */
```
**Source:** Follows Tailwind v4 cascade layer rules -- unlayered imports (driver.js) placed before layered imports (Tailwind).

### index.ts Barrel Export (Placeholder)
```typescript
// src/components/onboarding/index.ts
// Onboarding module — components will be added in Phase 2-4
export { tourSteps } from './steps';
export type { TourStepDef } from './steps';
```
**Source:** Standard TypeScript barrel export pattern.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-joyride for React tours | driver.js (framework-agnostic) | React 19 (2024) broke React-specific libraries | Must use framework-agnostic library for React 19+ projects |
| Tailwind CSS v3 flat CSS | Tailwind CSS v4 native cascade layers | Tailwind v4 (2025) | Unlayered third-party CSS has higher specificity than Tailwind utilities. No `!important` needed for overrides |
| `import 'lib/style.css'` anywhere | Static `@import` for third-party CSS in Vite | Vite production behavior | Dynamic CSS import unreliable in Vite production. Static import is the only safe approach |

**Deprecated/outdated:**
- `unmountComponentAtNode` (React DOM): Removed in React 19. This is what breaks react-joyride.
- Tailwind v3 `@layer` directives (e.g., `@layer base`, `@layer components`): In v4, these map to native CSS cascade layers with different specificity semantics.

## Open Questions

1. **Close button position in RTL**
   - What we know: driver.js positions the close button with absolute positioning using `left` and `right` CSS properties. The override `left: unset; right: 8px;` should move it to the right side for RTL.
   - What's unclear: The exact pixel values for close button positioning may need visual adjustment after testing. The close button may already respect RTL if driver.js uses logical properties internally.
   - Recommendation: Implement the CSS override, then visually verify during Phase 1 testing. Adjust pixel values if needed.

2. **Arrow direction in RTL for side-left/side-right popovers**
   - What we know: When a popover is placed on the "left" side of an element, in an RTL layout it should visually appear on the right. driver.js may or may not account for this.
   - What's unclear: Whether driver.js's `side: 'left'` means CSS-left (physical) or start-side (logical) in an RTL context.
   - Recommendation: Test with a step using `side: 'left'` in RTL. If the popover appears on the wrong side, swap `left`/`right` in step definitions for RTL layouts, or use `onPopoverRender` to adjust.

3. **Vite `@import` resolution for `driver.js/dist/driver.css`**
   - What we know: Vite resolves bare module specifiers in `@import` via `node_modules`. This should work for `@import "driver.js/dist/driver.css"`.
   - What's unclear: Whether this works reliably with the `@tailwindcss/vite` plugin and Tailwind v4's CSS processing pipeline.
   - Recommendation: Test immediately after adding the import. If it fails, use the full relative path: `@import "../../node_modules/driver.js/dist/driver.css"`.

## Sources

### Primary (HIGH confidence)
- [driver.js Official Configuration Docs](https://driverjs.com/docs/configuration) -- All config properties, types, defaults
- [driver.js Official Theming Docs](https://driverjs.com/docs/theming) -- CSS class names for popover theming
- [driver.js Styling Popover Docs](https://driverjs.com/docs/styling-popover) -- onPopoverRender hook, PopoverDOM structure
- [driver.js Source CSS](https://github.com/kamranahmedse/driver.js/blob/master/src/driver.css) -- Complete list of 27 CSS class selectors including all arrow direction variants
- Barname codebase analysis -- `src/atoms/index.ts`, `src/index.css`, `src/App.tsx`, all component files, `index.html`, `vite.config.ts`, `package.json`

### Secondary (MEDIUM confidence)
- [Tailwind CSS v4 Cascade Layers Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/13188) -- Confirms v4 uses native CSS cascade layers, unlayered CSS has higher specificity
- [Vite Dynamic CSS Import Discussion](https://github.com/vitejs/vite/discussions/14700) -- Confirms dynamic CSS import fails in production, recommends static import or JS wrapper
- [Vite Dynamic CSS Import Issue #4237](https://github.com/vitejs/vite/issues/4237) -- Original issue documenting dynamic CSS import failure in production builds
- [driver.js RTL PR #569](https://github.com/kamranahmedse/driver.js/pull/569) -- Open PR for RTL support, not merged as of Feb 2026

### Tertiary (LOW confidence)
- Close button exact pixel positioning in RTL -- needs visual testing, CSS values are estimated
- driver.js `side: 'left'/'right'` behavior in RTL context -- needs empirical testing to determine if physical or logical

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- driver.js verified as only viable option. Existing dependencies confirmed from package.json.
- Architecture: HIGH -- Project structure follows established codebase conventions. CSS import strategy verified via Vite issues.
- Pitfalls: HIGH -- All pitfalls verified from official sources (Vite issues, Tailwind discussions, driver.js docs/source).
- Code examples: HIGH -- CSS class names verified from driver.js source. Jotai pattern from existing codebase. Persian text is new content.

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (driver.js and Tailwind v4 are stable; unlikely to change within 30 days)
