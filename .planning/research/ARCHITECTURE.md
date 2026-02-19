# Architecture: Onboarding & Coach Marks with driver.js

**Domain:** User onboarding in a React 19 SPA (course scheduling app)
**Researched:** 2026-02-19
**Confidence:** HIGH

## Recommended Architecture

Use **driver.js** for the spotlight/tour engine and build the **welcome modal** as a custom React component. This replaces the earlier recommendation to build a custom tour engine from scratch with Floating UI -- driver.js handles spotlight, tooltip positioning, scroll management, and step navigation out of the box for ~5kb gzipped.

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Onboarding Layer                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ WelcomeModal     │  │ driver.js tour   │  │ HelpButton       │   │
│  │ (custom React)   │  │ (external lib)   │  │ (header "?")     │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│           │                     │                      │             │
├───────────┴─────────────────────┴──────────────────────┴─────────────┤
│                    Onboarding State (Jotai atoms)                     │
│  ┌───────────────────────┐  ┌──────────────────────────────────┐    │
│  │ onboardingCompleteAtom │  │ onboardingVersionAtom            │    │
│  │ atomWithStorage        │  │ atomWithStorage (version key)    │    │
│  └───────────────────────┘  └──────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│  CSS Override Layer                                                   │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ driver-overrides.css                                          │    │
│  │ - Dark mode: .dark .driver-popover { ... }                    │    │
│  │ - RTL: [dir="rtl"] .driver-popover { ... }                    │    │
│  │ - Custom theme: .barname-tour .driver-popover { ... }         │    │
│  └──────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│                    Existing App (minimal changes)                     │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────┐                │
│  │ Header   │  │ CourseSearch   │  │ WeeklySchedule │                │
│  │ +HelpBtn │  │ +data-tour    │  │ +data-tour     │                │
│  └──────────┘  └───────────────┘  └────────────────┘                │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `WelcomeModal.tsx` | Custom React carousel modal (3-4 slides). Shown on first visit. Offers "Start Tour" and "Skip" buttons | Jotai atoms (reads/writes completion state) |
| `CoachMarks.tsx` | Configures and launches driver.js tour. Defines step array. Handles tour lifecycle callbacks | driver.js API, Jotai atoms (reads completion, writes on done) |
| `HelpButton.tsx` | "?" icon in header. Relaunches tour on click | Jotai atoms (resets completion state), CoachMarks (triggers tour) |
| `useOnboarding.ts` | Hook encapsulating Jotai atoms and tour launch logic | Jotai store, driver.js API |
| `driver-overrides.css` | CSS file for dark mode + RTL styling of driver.js popovers | Imported globally alongside driver.js default CSS |
| `steps.ts` | Pure data file defining tour steps (selectors, titles, descriptions, placement) | Consumed by CoachMarks.tsx |

### Why NOT Build From Scratch

The previous architecture research recommended building a custom tour engine with Floating UI. After deeper investigation, this approach has clear downsides:

| Concern | Custom (Floating UI) | driver.js |
|---------|----------------------|-----------|
| Implementation effort | ~300-400 lines of core logic + edge cases | ~50 lines of configuration |
| Spotlight overlay | Must build (box-shadow or SVG mask approach) | Built-in, animated, with padding config |
| Scroll-into-view | Must implement with sticky header offset | Built-in with `scrollIntoView` config |
| Step navigation | Must build state machine (prev/next/skip) | Built-in with keyboard support |
| Tooltip positioning | Need @floating-ui/react-dom (~3kb+) | Built-in positioning engine |
| Resize handling | Must add ResizeObserver + recalculate | Built-in |
| Bundle size | @floating-ui/react-dom ~3kb + custom code | driver.js ~5kb (all-inclusive) |
| Maintenance | Own code to maintain forever | Community-maintained, 22k stars |
| React 19 compat | Floating UI works fine | No React dependency at all |

**The 2kb size difference does not justify building from scratch.** Driver.js provides battle-tested spotlight, scroll, positioning, and navigation that would take days to replicate and debug.

## Project Structure

```
src/
├── components/
│   └── onboarding/
│       ├── WelcomeModal.tsx       # Custom carousel modal (React + Tailwind)
│       ├── CoachMarks.tsx         # driver.js tour config and launcher
│       ├── HelpButton.tsx         # Header "?" button
│       ├── steps.ts              # Tour step definitions (pure data)
│       └── index.ts              # Public exports
├── hooks/
│   └── useOnboarding.ts          # Jotai atoms + tour control hook
└── styles/
    └── driver-overrides.css      # Dark mode + RTL CSS for driver.js
```

### Structure Rationale

- **`components/onboarding/`**: All onboarding code is isolated. The entire feature can be lazy-loaded. If removed, delete one folder + one hook + one CSS file.
- **`steps.ts` as pure data**: Separates "what to show" from "how to show it". Each step is a driver.js step config object with target selector, popover content, and placement.
- **`driver-overrides.css` separate file**: Keeps driver.js theme overrides isolated from Tailwind utility classes. Imported alongside `driver.js/dist/driver.css`.

## Data Flow

### Onboarding Lifecycle

```
App mounts
    |
    v
useOnboarding() hook reads atoms
    |
    ├── onboardingCompleteAtom === false (first visit)
    │       |
    │       v
    │   WelcomeModal renders (carousel)
    │       |
    │       ├── User clicks "Skip"
    │       │       → set onboardingCompleteAtom = true
    │       │       → nothing more renders
    │       │
    │       └── User clicks "Start Tour"
    │               → dismiss modal
    │               → call launchTour() from CoachMarks
    │               → driver.js takes over the page
    │               → on tour complete/dismiss:
    │                   set onboardingCompleteAtom = true
    │
    └── onboardingCompleteAtom === true (returning visit)
            → nothing renders
            → HelpButton visible in header
                |
                └── User clicks "?"
                        → call launchTour() from CoachMarks
                        → driver.js takes over the page
                        → (does NOT reset completion atom)
```

### driver.js Integration Pattern

```typescript
// CoachMarks.tsx
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../styles/driver-overrides.css';
import { tourSteps } from './steps';
import { toPersianDigits } from '../../utils/persian';

export function launchTour(onComplete: () => void) {
  const isMobile = window.matchMedia('(max-width: 1023px)').matches;

  // Filter steps by device
  const steps = tourSteps.filter(step =>
    step.device === 'both' || (isMobile ? step.device === 'mobile' : step.device === 'desktop')
  );

  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: 'black',
    overlayOpacity: 0.5,
    stagePadding: 8,
    stageRadius: 8,
    popoverClass: 'barname-tour',
    nextBtnText: '\u0628\u0639\u062f\u06cc',       // بعدی
    prevBtnText: '\u0642\u0628\u0644\u06cc',        // قبلی
    doneBtnText: '\u067e\u0627\u06cc\u0627\u0646',  // پایان
    progressText: `{{current}} \u0627\u0632 {{total}}`,
    onDestroyStarted: () => {
      onComplete();
      driverObj.destroy();
    },
    steps: steps.map(s => ({
      element: s.targetSelector,
      popover: {
        title: s.title,
        description: s.description,
        side: s.side,
        align: s.align,
      },
    })),
  });

  driverObj.drive();
}
```

### Step Definitions Pattern

```typescript
// steps.ts
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
    id: 'search',
    targetSelector: '[data-tour="course-search"]',
    title: '...',       // Persian text
    description: '...', // Persian text
    side: 'left',
    align: 'start',
    device: 'desktop',
  },
  {
    id: 'mobile-add',
    targetSelector: '[data-tour="mobile-add-btn"]',
    title: '...',
    description: '...',
    side: 'top',
    align: 'center',
    device: 'mobile',
  },
  // ... more steps
];
```

## Element Targeting Strategy

Use `data-tour` attributes on stable wrapper elements. Do NOT target FullCalendar internals.

### data-tour Attribute Targets

| Attribute | Element | Component File | Notes |
|-----------|---------|---------------|-------|
| `data-tour="course-search"` | Search sidebar wrapper | `CourseSearch.tsx` | Desktop only |
| `data-tour="mobile-add-btn"` | Mobile "+" FAB | `App.tsx` | Mobile only |
| `data-tour="calendar"` | Calendar wrapper div | `WeeklySchedule.tsx` | Both |
| `data-tour="schedule-tabs"` | Tab bar | `ScheduleTabs.tsx` | Both |
| `data-tour="export-buttons"` | Export buttons group | `ExportButtons.tsx` | Both |
| `data-tour="exams-toggle"` | Exams toggle button | `App.tsx` | Both |
| `data-tour="dark-mode"` | Dark mode toggle | `App.tsx` | Both |

These attributes have zero behavioral impact -- they are just HTML attributes for driver.js to find elements.

## Z-Index Strategy

Driver.js manages its own z-index internally. By default it uses z-index 10000 for the overlay and 10001 for the popover, which is well above all existing app z-indices (max z-50).

**No z-index conflicts expected.** The existing app's z-index map:
- Header: z-40
- Mobile bottom sheet / FAB / modals: z-50
- driver.js overlay: z-10000 (default, internal)
- driver.js popover: z-10001 (default, internal)

If customization is needed, driver.js overlay z-index can be adjusted via CSS:
```css
.driver-overlay { z-index: 10000 !important; }
.driver-popover { z-index: 10001 !important; }
```

## Dark Mode Integration

Driver.js renders its own DOM elements outside React. Style them with CSS using the project's `.dark` class:

```css
/* driver-overrides.css */

/* Dark mode */
.dark .driver-popover {
  background-color: #1e293b;  /* slate-800 */
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
.dark .driver-popover-prev-btn,
.dark .driver-popover-next-btn {
  background-color: #3b82f6;  /* blue-500 */
  color: white;
  border-color: #3b82f6;
}
.dark .driver-popover-prev-btn {
  background-color: transparent;
  color: #94a3b8;
  border-color: #475569;
}
.dark .driver-popover-arrow-side-top { /* arrow pointing up */
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
```

**Key point:** Since driver.js reads the current DOM state when rendering, and the `.dark` class is on the `<html>` element, the CSS selectors above will automatically apply the correct theme. If a user toggles dark mode mid-tour, the next step will render with the correct colors.

## RTL Integration

```css
/* driver-overrides.css (continued) */

/* RTL layout */
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
  left: auto;
  right: unset;
  /* driver.js positions close button with absolute positioning;
     may need adjustment based on actual rendering */
}

[dir="rtl"] .driver-popover-progress-text {
  direction: rtl;
}
```

**Note:** The close button and arrow positioning may need fine-tuning after visual testing. The open PR (#569) for RTL suggests these are the main areas that need adjustment.

## Responsive Design Strategy

| Concern | Desktop | Mobile |
|---------|---------|--------|
| Welcome modal | Centered, max-width 480px, rounded | Near-full-width, bottom-aligned or centered |
| Tour steps | All steps including sidebar search | Skip sidebar-specific steps; show FAB step instead |
| Tooltip placement | driver.js auto-positions | Same; `shift` behavior keeps tooltips in viewport |
| Step count | ~6-7 steps | ~5-6 steps (skip desktop-only) |

Device detection at tour launch:
```typescript
const isMobile = window.matchMedia('(max-width: 1023px)').matches;
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Wrapping driver.js in a React Component

**What:** Creating a `<DriverTour steps={...} />` React component that renders driver.js declaratively.
**Why bad:** driver.js is imperative (call `driver.drive()`). Wrapping it in a React component creates lifecycle management complexity (when to init, when to destroy, how to handle re-renders). The driver.js instance manages its own DOM.
**Instead:** Use an imperative `launchTour()` function called from event handlers. Let driver.js own its lifecycle.

### Anti-Pattern 2: Storing Tour Step Index in React State

**What:** Putting `currentStep` in a Jotai atom or useState, then syncing it with driver.js.
**Why bad:** driver.js has its own internal step state. Duplicating it in React creates sync bugs and double-renders.
**Instead:** Let driver.js manage step navigation internally. Use its callbacks (`onNextClick`, `onPrevClick`, `onDestroyStarted`) to react to events, not to drive state.

### Anti-Pattern 3: Targeting FullCalendar Internals

**What:** Using `.fc-timegrid-slot` or `.fc-event` as tour step selectors.
**Why bad:** FullCalendar re-renders its DOM when events change. Internal class names are not stable API. The transposed calendar has entirely different DOM.
**Instead:** Target the wrapper div with `data-tour="calendar"`. Highlight the whole calendar area, not individual slots or events.

### Anti-Pattern 4: Importing driver.js Eagerly

**What:** `import { driver } from 'driver.js'` at the top of App.tsx.
**Why bad:** Loads driver.js (~5kb) for every user, even returning users who have completed onboarding.
**Instead:** Dynamic import only when needed:
```typescript
async function launchTour() {
  const { driver } = await import('driver.js');
  await import('driver.js/dist/driver.css');
  // ... configure and launch
}
```

## Build Order

```
1. Jotai atoms (onboardingCompleteAtom)
   - No dependencies. Add to existing atoms/index.ts.
   - 5 minutes of work.

2. CSS overrides file (driver-overrides.css)
   - No dependencies. Pure CSS.
   - Write dark mode + RTL overrides.
   - 30 minutes of work.

3. Step definitions (steps.ts)
   - No dependencies. Pure data file.
   - Define 6-7 steps with selectors, content, device flags.
   - 30 minutes of work.

4. data-tour attributes on existing components
   - No dependencies. Add HTML attributes.
   - ~7 attributes across 5 files.
   - 15 minutes of work.

5. CoachMarks.tsx (driver.js tour launcher)
   - Depends on: steps.ts, driver-overrides.css, driver.js (npm install)
   - ~50-80 lines of code.
   - 1-2 hours of work.

6. WelcomeModal.tsx (custom carousel)
   - No external dependencies. React + Tailwind.
   - ~100-150 lines of code.
   - 2-3 hours of work.

7. HelpButton.tsx
   - Depends on: CoachMarks (launchTour function)
   - ~20 lines of code.
   - 15 minutes of work.

8. useOnboarding.ts hook
   - Depends on: atoms, CoachMarks, WelcomeModal
   - Orchestrates the flow.
   - ~40 lines of code.

9. Integration in App.tsx
   - Wire up WelcomeModal + HelpButton
   - 15 minutes of work.
```

**Total estimated effort:** 5-8 hours for a working MVP.

**Critical path:** Items 1-4 can be done in parallel. Item 5 (CoachMarks) is the core. Item 6 (WelcomeModal) can be built in parallel with 5. Items 7-9 are quick integration.

## Sources

- [driver.js Official Documentation](https://driverjs.com) -- API, configuration, theming
- [driver.js GitHub Repository](https://github.com/kamranahmedse/driver.js) -- Source, issues, releases
- [driver.js Theming Docs](https://driverjs.com/docs/theming) -- CSS class names, popoverClass API
- [driver.js Styling Popover Docs](https://driverjs.com/docs/styling-popover) -- onPopoverRender hook, HTML content
- [React Joyride React 19 Issues](https://github.com/gilbarbara/react-joyride/issues/1122) -- Why not react-joyride
- [Reactour React 19 Issue #659](https://github.com/elrumordelaluz/reactour/issues/659) -- Why not @reactour/tour
- Barname codebase analysis (App.tsx, z-index map, component structure) -- Integration planning

---
*Architecture research for: Onboarding & Coach Marks in Barname (driver.js approach)*
*Researched: 2026-02-19*
