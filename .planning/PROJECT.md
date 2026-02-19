# Barname - User Onboarding & Coach Marks

## What This Is

Adding a first-time user onboarding experience to Barname (plan.csut.ir), the course scheduling app for University of Tehran's Faculty of Mathematics, Statistics & Computer Science. New visitors see a welcome carousel introducing features, followed by an interactive step-by-step coach mark tour that highlights real UI elements. A "?" help button lets returning users relaunch the tour anytime.

## Core Value

First-time users should immediately understand how to use the app and discover non-obvious power features (slot-drag filtering, hover preview, multiple schedules) without the onboarding annoying power users who want to skip fast.

## Requirements

### Validated

- ✓ Course search by name, code, or professor — existing
- ✓ Specialized vs general course tabs — existing
- ✓ Course filters (day, gender, department, hide conflicts) — existing
- ✓ Slot-drag time filter on calendar — existing
- ✓ Hover preview of courses on calendar — existing
- ✓ Multiple schedules (up to 5) with duplicate — existing
- ✓ Time and exam conflict detection — existing
- ✓ Export/import schedule as JSON — existing
- ✓ Download schedule as image (JPG) — existing
- ✓ Share schedule image (Web Share API / clipboard) — existing
- ✓ Add schedule to Google Calendar (ICS) — existing
- ✓ Manual course entry — existing
- ✓ Dark mode toggle — existing
- ✓ Rotated calendar view (90-degree) — existing
- ✓ Tutor profile modal — existing
- ✓ Exam table with conflict highlighting — existing

### Active

- [ ] Welcome carousel modal for first-time users
- [ ] Step-by-step coach mark tour highlighting real UI elements
- [ ] Adaptive tour for both desktop and mobile
- [ ] "?" help button in header to relaunch tour anytime
- [ ] localStorage persistence so onboarding shows only once
- [ ] Fast skip for power users (skip button, keyboard escape)

### Out of Scope

- Video tutorials — overkill for this app's complexity
- Per-feature contextual help / tooltips outside the tour — adds ongoing UI clutter
- A/B testing of onboarding flows — no analytics infrastructure for this
- Localization of onboarding to non-Persian — app is Persian-only

## Context

The app is a static client-side SPA with no backend. All state persists in localStorage via Jotai's `atomWithStorage`. The existing codebase already has one "hint" pattern: a dismissible slot-drag hint in `WeeklySchedule.tsx` that uses localStorage to track dismissal. The onboarding should follow the same persistence pattern.

Key hidden features that new users miss:
1. **Slot-drag filter** — dragging on empty calendar slots filters courses by time. Very hidden, no affordance.
2. **Hover preview** — hovering a course card shows a ghost preview on the calendar. Users must discover this by accident.
3. **Multiple schedules** — the tab bar at the top lets users create up to 5 schedules and compare options. Easy to overlook.
4. **Export/Import/Share** — JSON export/import for sharing schedules between users, image download, Google Calendar integration. Buttons are small and in the header.

The app is RTL (Persian). All onboarding text must be in Persian. Vazirmatn font is already loaded.

## Constraints

- **No dependencies if possible**: Prefer building coach marks from scratch over adding a library — keeps bundle small and gives full control over UX
- **RTL**: All positioning and animations must work correctly in RTL layout
- **Dark mode**: Onboarding must support both light and dark themes
- **Mobile**: Tour must adapt — some features (slot-drag, hover) are desktop-only and should be skipped on mobile
- **Performance**: No layout shifts or heavy animations that block interaction

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Welcome modal + tour (two-phase) | Users get a quick overview first, then optional interactive walkthrough | — Pending |
| Carousel slides in welcome modal | One feature per slide — more visual, helps users absorb gradually | — Pending |
| Build coach marks from scratch | Avoids library dependency, full RTL/dark mode control, small bundle | — Pending |
| Show once + "?" button | Respects power users while keeping access for anyone who wants it | — Pending |

---
*Last updated: 2026-02-19 after initialization*
