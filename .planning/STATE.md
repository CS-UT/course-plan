# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** First-time users immediately understand how to use Barname and discover non-obvious power features without annoying power users who want to skip fast.
**Current focus:** Phase 3 complete -- ready for Phase 4 (Polish)

## Current Position

Phase: 3 of 4 (Coach Marks) -- COMPLETE
Plan: 1 of 1 in current phase -- ALL DONE
Status: Phase 3 complete
Last activity: 2026-02-19 -- Completed 03-01-PLAN.md (Tour engine with startTour)

Progress: [████████░░] 85%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~6min
- Total execution time: ~0.38 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/2 | ~18min | ~9min |
| 02-welcome-modal | 1/1 | ~2min | ~2min |
| 03-coach-marks | 1/1 | ~2min | ~2min |

**Recent Trend:**
- Last 5 plans: 01-01 (3min), 01-02 (~15min), 02-01 (2min), 03-01 (2min)
- Trend: On track, accelerating

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: driver.js v1.4.0 as only new dependency -- MIT licensed, React-version-agnostic, ~5kb gzipped
- [Roadmap]: Custom welcome modal in React/Tailwind (no carousel library) -- ~100-150 LOC, full RTL/dark control
- [Roadmap]: Phases 2 and 3 can run in parallel (both depend only on Phase 1)
- [01-01]: CSS import order: Google Fonts -> driver-overrides.css -> tailwindcss (unlayered for specificity over Tailwind layers)
- [01-01]: Bare module specifier @import driver.js/dist/driver.css works with Vite resolution (no relative path needed)
- [01-01]: Versioned localStorage key plan-onboarding-v1 enables future reset capability
- [01-02]: data-tour attributes on outermost wrapper elements, never on FullCalendar internals
- [01-02]: Visual verification done via Playwright -- bare module specifiers don't work from browser console
- [02-01]: max-w-sm (384px) card width for tighter mobile-friendly modal
- [02-01]: No backdrop click dismiss -- intentional first-time content requires explicit Skip or Start Tour
- [02-01]: Positive translateX for RTL carousel -- flex children flow RTL so positive X moves forward
- [02-01]: handleStartTour is a console.log placeholder -- Phase 3/4 will wire to driver.js
- [03-01]: onDestroyed hook fires onComplete for both tour completion and dismissal (Escape/close)
- [03-01]: isMobile() called at launch time not module load for resize/rotation support
- [03-01]: onPopoverRender converts progress digits to Persian via toPersianDigits utility

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED] [Research]: RTL CSS overrides for driver.js popovers need manual visual testing -- VERIFIED: RTL layout correct in both light/dark mode
- [RESOLVED] [Research]: Tailwind CSS v4 layer system may affect driver.js default styles -- VERIFIED: unlayered import before tailwindcss works correctly
- [RESOLVED] [Research]: Persian progress text in driver.js uses Western digits -- RESOLVED: onPopoverRender + toPersianDigits converts digits at render time
- [RESOLVED] [Research]: All Persian copy for carousel slides and tour tooltips needs to be authored -- DONE: 4 slides authored in welcomeSlides.ts

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 03-01-PLAN.md. Phase 3 complete. Ready for Phase 4 (Polish).
Resume file: None
