---
phase: 03-coach-marks
plan: 01
subsystem: ui
tags: [driver.js, onboarding, tour, persian, rtl, mobile]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "driver.js dependency, driver-overrides.css, tour step definitions (steps.ts), data-tour attributes"
  - phase: 02-welcome-modal
    provides: "WelcomeModal with handleStartTour placeholder ready to wire"
provides:
  - "startTour(onComplete?) function that launches device-aware driver.js guided tour"
  - "Persian UI labels and Persian digit progress indicators"
  - "Mobile viewport CSS safety for narrow screens"
  - "Barrel export of startTour from onboarding/index.ts"
affects: [04-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Imperative tour launcher (not React hook) for event handler invocation", "Device detection at call time via isMobile() for resize/rotation support"]

key-files:
  created: [src/components/onboarding/tour.ts]
  modified: [src/components/onboarding/index.ts, src/components/onboarding/driver-overrides.css]

key-decisions:
  - "onDestroyed hook fires onComplete for both tour completion and dismissal (Escape/close button)"
  - "isMobile() called at launch time not module load for resize/rotation support"
  - "onPopoverRender converts progress digits to Persian via toPersianDigits utility"

patterns-established:
  - "Imperative startTour pattern: plain function, no React lifecycle, called from event handlers"
  - "Device-aware step filtering: tourSteps filtered by device field at launch time"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 3 Plan 1: Tour Engine Summary

**startTour() function with device-aware step filtering, Persian labels/digits, mobile-safe popovers, and onComplete callback for driver.js guided tour**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T10:34:24Z
- **Completed:** 2026-02-19T10:36:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created startTour() that launches driver.js tour with device-appropriate steps (desktop vs mobile filtering)
- Persian progress indicators with digit conversion via onPopoverRender hook
- Persian navigation button labels (Next/Previous/Done)
- Mobile viewport CSS safety net preventing popover clipping on narrow screens
- Tour dismissible via close button and Escape key with onComplete callback on destruction

## Task Commits

Each task was committed atomically:

1. **Task 1: Create startTour function and update barrel export** - `9743f4e` (feat)
2. **Task 2: Add mobile viewport CSS safety and verify build** - `d94ad02` (feat)

## Files Created/Modified
- `src/components/onboarding/tour.ts` - Core tour engine: startTour() with device filtering, Persian labels, digit conversion, onComplete callback
- `src/components/onboarding/index.ts` - Added barrel export for startTour
- `src/components/onboarding/driver-overrides.css` - Added mobile viewport safety media query for narrow screens

## Decisions Made
- onDestroyed hook fires onComplete for both tour completion and dismissal -- ensures cleanup runs regardless of how user exits
- isMobile() called at launch time (not module load) so resize/rotation before tour start is respected
- onPopoverRender converts progress digits to Persian using existing toPersianDigits utility from persian.ts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- startTour(onComplete) is ready for Phase 4 to wire into WelcomeModal's handleStartTour and help button
- All tour infrastructure (steps, CSS, tour engine) complete for Phase 3
- Persian progress text blocker from STATE.md is now resolved via onPopoverRender workaround

## Self-Check: PASSED

All files verified present. Both task commits (9743f4e, d94ad02) confirmed in git log.

---
*Phase: 03-coach-marks*
*Completed: 2026-02-19*
