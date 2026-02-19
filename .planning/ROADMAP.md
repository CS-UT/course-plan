# Roadmap: Barname Onboarding & Coach Marks

## Overview

Deliver a two-phase onboarding experience (welcome carousel + interactive coach marks tour) for first-time Barname users, built on driver.js with full RTL, dark mode, and mobile support. The work flows from technical foundation (driver.js setup, CSS overrides, persistence) through two independent UI deliverables (welcome modal, then coach marks tour) to final integration that wires everything into the app and handles edge cases.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Install driver.js, create dark mode + RTL CSS overrides, set up persistence atoms and project structure
- [ ] **Phase 2: Welcome Modal** - Build responsive carousel modal with feature slides, skip/start-tour actions, and theme support
- [ ] **Phase 3: Coach Marks Tour** - Configure driver.js tour with device-aware steps, spotlight overlay, Persian navigation, and progress indicator
- [ ] **Phase 4: Integration & Polish** - Wire onboarding into App.tsx, add help button, guard against export capture, verify end-to-end flow

## Phase Details

### Phase 1: Foundation
**Goal**: All technical infrastructure exists so that subsequent phases can build UI on a solid base -- driver.js is installed and loadable, CSS overrides handle dark mode and RTL, persistence atoms are ready, and the project structure is established
**Depends on**: Nothing (first phase)
**Requirements**: TECH-01, TECH-02, TECH-03, TECH-04, TECH-05, THME-01, THME-02, THME-04, PERS-01, PERS-04
**Success Criteria** (what must be TRUE):
  1. driver.js can be dynamically imported in a component without bundling it for returning users (verified via dev tools network tab)
  2. A test popover rendered by driver.js displays correctly in dark mode (dark background, light text) and in RTL layout (text right-aligned, arrow on correct side)
  3. A Jotai atom with versioned localStorage key (e.g., plan-onboarding-v1) persists onboarding state across page reloads
  4. Tour step definitions exist in a separate data file (steps.ts) inside src/components/onboarding/, and data-tour attributes are placed on target elements in existing components
  5. All onboarding text renders in Persian with Vazirmatn font
**Plans**: 2 plans (Wave 1: both parallel)

Plans:
- [x] 01-01-PLAN.md -- Install driver.js, create CSS overrides (dark mode + RTL + font), tour step definitions, persistence atom, barrel export
- [x] 01-02-PLAN.md -- Add data-tour attributes to 7 target elements across 5 components, visual verification checkpoint

### Phase 2: Welcome Modal
**Goal**: First-time visitors see a polished, skippable carousel modal that introduces app features and offers entry into the interactive tour
**Depends on**: Phase 1
**Requirements**: WELC-01, WELC-02, WELC-03, WELC-04, WELC-05, THME-03, ADPT-02
**Success Criteria** (what must be TRUE):
  1. A first-time visitor (no localStorage flag) sees a centered modal with semi-transparent backdrop showing 3-4 feature slides
  2. Each slide has a Persian headline and description highlighting one app feature, navigable via dot indicators or swipe/click
  3. User can click "Start Tour" on the last slide (or any slide) to dismiss the modal and trigger the coach marks tour
  4. User can click "Skip" to dismiss the modal entirely without launching the tour
  5. Modal renders correctly on both mobile (< 640px) and desktop viewports, and matches the active theme (light or dark)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Coach Marks Tour
**Goal**: Users who launch the tour see an interactive step-by-step walkthrough that spotlights real UI elements with device-appropriate steps, clear navigation, and progress feedback
**Depends on**: Phase 1
**Requirements**: TOUR-01, TOUR-02, TOUR-03, TOUR-04, TOUR-05, TOUR-06, TOUR-07, ADPT-01, ADPT-03
**Success Criteria** (what must be TRUE):
  1. On desktop, the tour highlights 4-5 elements (course search sidebar, calendar, schedule tabs, exams table, export buttons) with a spotlight overlay dimming the rest of the page
  2. On mobile, the tour highlights mobile-appropriate elements (mobile add FAB, calendar, schedule tabs, exams table, export buttons), skipping desktop-only steps
  3. Each step shows a Persian progress indicator (e.g., "۲ از ۵") and Next/Previous/Done buttons with Persian labels
  4. User can dismiss the tour at any step via a close button or the Escape key
  5. Tour popovers remain fully visible within the viewport on all screen sizes without clipping
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Integration & Polish
**Goal**: The complete onboarding flow works end-to-end in production -- first visit triggers welcome then optional tour, returning visits see nothing, and any user can relaunch via the help button
**Depends on**: Phase 2, Phase 3
**Requirements**: PERS-02, PERS-03, TECH-06
**Success Criteria** (what must be TRUE):
  1. A returning user (localStorage flag set) never sees the welcome modal on page load
  2. A "?" help button is visible in the header and clicking it relaunches the coach marks tour for any user at any time
  3. Onboarding overlays and popovers are excluded from schedule image export (JPG download produces a clean image with no onboarding artifacts)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4
Note: Phases 2 and 3 can execute in parallel since both depend only on Phase 1.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-02-19 |
| 2. Welcome Modal | 0/? | Not started | - |
| 3. Coach Marks Tour | 0/? | Not started | - |
| 4. Integration & Polish | 0/? | Not started | - |
