# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** First-time users immediately understand how to use Barname and discover non-obvious power features without annoying power users who want to skip fast.
**Current focus:** Phase 1 complete -- ready for Phase 2 (Welcome Modal) and Phase 3 (Coach Marks Tour)

## Current Position

Phase: 1 of 4 (Foundation) -- COMPLETE
Plan: 2 of 2 in current phase -- ALL DONE
Status: Phase 1 complete
Last activity: 2026-02-19 -- Completed 01-02-PLAN.md (Data-tour attributes + visual verification)

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~9min
- Total execution time: ~0.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/2 | ~18min | ~9min |

**Recent Trend:**
- Last 5 plans: 01-01 (3min), 01-02 (~15min)
- Trend: On track

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

### Pending Todos

None yet.

### Blockers/Concerns

- [RESOLVED] [Research]: RTL CSS overrides for driver.js popovers need manual visual testing -- VERIFIED: RTL layout correct in both light/dark mode
- [RESOLVED] [Research]: Tailwind CSS v4 layer system may affect driver.js default styles -- VERIFIED: unlayered import before tailwindcss works correctly
- [Research]: Persian progress text in driver.js uses Western digits -- may need onPopoverRender workaround or custom indicator
- [Research]: All Persian copy for carousel slides and tour tooltips needs to be authored

## Session Continuity

Last session: 2026-02-19
Stopped at: Phase 1 complete. Ready for Phase 2 and/or Phase 3.
Resume file: None
