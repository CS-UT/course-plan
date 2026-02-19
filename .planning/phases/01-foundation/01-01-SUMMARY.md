---
phase: 01-foundation
plan: 01
subsystem: ui
tags: [driver.js, onboarding, css, rtl, dark-mode, jotai, persian]

# Dependency graph
requires: []
provides:
  - "driver.js installed as project dependency (v1.4.0)"
  - "CSS override file with dark mode, RTL, and Vazirmatn font overrides for driver.js popovers"
  - "7 Persian-language tour step definitions with selectors, placement, and device flags"
  - "Jotai persistence atom (onboardingCompletedAtom) with versioned localStorage key plan-onboarding-v1"
  - "Barrel export for onboarding module"
affects: [02-welcome-modal, 03-coach-marks, 04-integration]

# Tech tracking
tech-stack:
  added: [driver.js@1.4.0]
  patterns: [unlayered-css-imports-for-third-party, versioned-localstorage-keys, pure-data-step-definitions]

key-files:
  created:
    - src/components/onboarding/driver-overrides.css
    - src/components/onboarding/steps.ts
    - src/components/onboarding/index.ts
  modified:
    - package.json
    - package-lock.json
    - src/index.css
    - src/atoms/index.ts

key-decisions:
  - "CSS import order: Google Fonts -> driver-overrides.css -> tailwindcss (unlayered for specificity over Tailwind layers)"
  - "Bare module specifier @import driver.js/dist/driver.css works with Vite resolution (no relative path needed)"
  - "Versioned localStorage key plan-onboarding-v1 enables future reset capability"

patterns-established:
  - "Unlayered CSS imports: Third-party CSS imported before tailwindcss to maintain specificity without !important"
  - "Tour step pure data: Step definitions as typed data arrays separate from rendering logic"
  - "Versioned storage keys: plan-{feature}-v{N} pattern for localStorage atoms"

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 1 Plan 1: Foundation Infrastructure Summary

**driver.js v1.4.0 with dark mode/RTL/Vazirmatn CSS overrides, 7 Persian tour step definitions, and Jotai persistence atom**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T09:32:26Z
- **Completed:** 2026-02-19T09:35:05Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Installed driver.js v1.4.0 and created CSS override file with dark mode (slate palette), RTL direction, and Vazirmatn font overrides
- Established correct CSS import order ensuring driver.js styles remain unlayered with higher specificity than Tailwind
- Created 7 Persian-language tour step definitions with target selectors, popover placement, and device-specific flags
- Added onboardingCompletedAtom with versioned localStorage key for persistence across sessions

## Task Commits

Each task was committed atomically:

1. **Task 1: Install driver.js and create CSS override file** - `af3a868` (feat)
2. **Task 2: Create tour step definitions, barrel export, and persistence atom** - `79d21e7` (feat)

## Files Created/Modified
- `src/components/onboarding/driver-overrides.css` - driver.js base CSS import + dark mode + RTL + font overrides
- `src/components/onboarding/steps.ts` - 7 tour step definitions with Persian text, selectors, placement, device flags
- `src/components/onboarding/index.ts` - Barrel export for onboarding module
- `src/atoms/index.ts` - Added onboardingCompletedAtom with plan-onboarding-v1 key
- `src/index.css` - Added driver-overrides.css import before tailwindcss
- `package.json` - Added driver.js dependency
- `package-lock.json` - Updated lockfile

## Decisions Made
- CSS import order places driver-overrides.css before tailwindcss so that driver.js popover styles remain unlayered and have higher specificity than Tailwind's layered utilities, avoiding any need for !important
- Used bare module specifier `@import "driver.js/dist/driver.css"` which Vite resolves from node_modules without needing a relative path
- localStorage key follows `plan-{feature}-v{N}` pattern (plan-onboarding-v1) for future reset capability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All infrastructure files are in place for Phase 2 (Welcome Modal) and Phase 3 (Coach Marks Tour)
- CSS overrides are ready for visual testing once driver.js popovers render in the browser
- Tour steps data is ready to be consumed by the driver.js tour runner
- Persistence atom is ready for conditional onboarding logic

## Self-Check: PASSED

- All 7 files verified present on disk
- Both commit hashes (af3a868, 79d21e7) verified in git log
- Build passes, TypeScript clean

---
*Phase: 01-foundation*
*Completed: 2026-02-19*
