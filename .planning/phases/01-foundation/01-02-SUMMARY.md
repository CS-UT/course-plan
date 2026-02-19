---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [data-tour, onboarding, visual-verification, driver.js]

# Dependency graph
requires: ["01-01"]
provides:
  - "7 data-tour attributes on stable wrapper elements across 5 component files"
  - "Visual verification: driver.js popovers render correctly in light mode, dark mode, and RTL layout"
affects: [02-welcome-modal, 03-coach-marks, 04-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [data-tour-attributes-on-wrapper-elements]

key-files:
  modified:
    - src/components/CourseSearch.tsx
    - src/components/WeeklySchedule.tsx
    - src/components/ScheduleTabs.tsx
    - src/components/ExportButtons.tsx
    - src/App.tsx

key-decisions:
  - "data-tour attributes placed on outermost wrapper divs, never on FullCalendar internals"
  - "Attribute values exactly match targetSelector values in steps.ts"

patterns-established:
  - "Tour anchor pattern: data-tour attributes as stable selectors for driver.js steps, decoupled from CSS classes"

# Metrics
duration: ~15min
completed: 2026-02-19
---

# Phase 1 Plan 2: Data-Tour Attributes & Visual Verification Summary

**7 data-tour attributes on target elements + visual verification of driver.js in light/dark mode with RTL**

## Performance

- **Completed:** 2026-02-19
- **Tasks:** 2 (1 auto + 1 visual verification checkpoint)
- **Files modified:** 5

## Accomplishments
- Added 7 `data-tour` attributes across 5 component files as stable anchor points for driver.js tour steps
- Visually verified driver.js popovers in light mode: Persian text in Vazirmatn font, RTL text alignment, correct button order, progress indicator "۱ از ۲"
- Visually verified driver.js popovers in dark mode: dark slate background (#1e293b), light text, matching arrow colors, correct navigation
- Confirmed no layout or behavioral regressions in the app

## Task Commits

1. **Task 1: Add data-tour attributes to 7 target elements** - `e4cb509` (feat)
2. **Task 2: Visual verification** - Verified via Playwright automated browser testing (no code commit needed)

## Files Modified
- `src/components/CourseSearch.tsx` - Added `data-tour="course-search"` on outermost div
- `src/components/WeeklySchedule.tsx` - Added `data-tour="calendar"` on outermost wrapper div
- `src/components/ScheduleTabs.tsx` - Added `data-tour="schedule-tabs"` on outermost div
- `src/components/ExportButtons.tsx` - Added `data-tour="export-buttons"` on outermost div
- `src/App.tsx` - Added `data-tour="mobile-add-btn"`, `data-tour="exams-toggle"`, `data-tour="dark-mode"`

## Visual Verification Results

Tested via Playwright browser automation:

| Check | Result |
|-------|--------|
| Persian text in Vazirmatn font | PASS |
| RTL text alignment | PASS |
| Navigation buttons correct RTL order | PASS |
| Progress indicator ("۱ از ۲") | PASS |
| Spotlight overlay | PASS |
| Dark mode background (#1e293b) | PASS |
| Dark mode light text | PASS |
| Dark mode arrow colors match | PASS |
| No layout regressions | PASS |

## Deviations from Plan

- Visual verification was done via Playwright automated testing instead of manual browser console test, because bare module specifiers (`import('driver.js')`) don't work from browser DevTools console — they only work through Vite's module transform pipeline.

## Issues Encountered
- Browser console `import('driver.js')` fails with `TypeError: Failed to resolve module specifier 'driver.js'` — resolved by testing through Vite-served app code via a temporary test button.

## Next Phase Readiness
- All 7 data-tour anchor points are in place for Phase 3 (Coach Marks Tour)
- CSS overrides confirmed working for both themes
- Foundation phase is complete — ready for Phase 2 (Welcome Modal) and Phase 3 (Coach Marks Tour)

## Self-Check: PASSED

- 7 data-tour attributes verified across 5 files
- Commit e4cb509 verified in git log
- Visual verification passed in both light and dark mode
- Build and TypeScript check pass

---
*Phase: 01-foundation*
*Completed: 2026-02-19*
