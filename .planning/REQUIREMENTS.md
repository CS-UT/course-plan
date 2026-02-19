# Requirements: Barname Onboarding & Coach Marks

**Defined:** 2026-02-19
**Core Value:** First-time users should immediately understand how to use the app and discover non-obvious power features (slot-drag filtering, hover preview, multiple schedules, export/share) without the onboarding annoying power users who want to skip fast.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Welcome Experience

- [ ] **WELC-01**: First-time visitor sees a welcome carousel modal introducing app features (3-4 slides)
- [ ] **WELC-02**: Each carousel slide highlights one feature with Persian headline and description
- [ ] **WELC-03**: Welcome modal has "Start Tour" button that launches interactive coach marks
- [ ] **WELC-04**: Welcome modal has "Skip" button that dismisses onboarding entirely
- [ ] **WELC-05**: Welcome modal is centered with semi-transparent backdrop (not full-screen takeover)

### Coach Marks Tour

- [ ] **TOUR-01**: Step-by-step coach marks highlight real UI elements using spotlight overlay
- [ ] **TOUR-02**: Tour targets 4-5 key elements via data-tour attributes (not FullCalendar internals)
- [ ] **TOUR-03**: Tour shows progress indicator with Persian text (e.g., "۲ از ۵")
- [ ] **TOUR-04**: Tour has Next/Previous/Done buttons with Persian labels
- [ ] **TOUR-05**: Tour can be dismissed at any step (close button + Escape key)
- [ ] **TOUR-06**: Desktop tour highlights: course search sidebar, calendar, schedule tabs, exams, export buttons
- [ ] **TOUR-07**: Mobile tour highlights: mobile add FAB, calendar, schedule tabs, exams, export buttons

### Device Adaptation

- [ ] **ADPT-01**: Tour steps are filtered by device — desktop-only steps skipped on mobile, mobile-only steps skipped on desktop
- [ ] **ADPT-02**: Welcome modal is responsive — works on both desktop and mobile viewports
- [ ] **ADPT-03**: driver.js popovers remain within viewport on all screen sizes

### Theme Compatibility

- [ ] **THME-01**: Coach marks popovers match dark mode when active (dark background, light text)
- [ ] **THME-02**: Coach marks popovers display correctly in RTL layout (text alignment, button order, arrow direction)
- [ ] **THME-03**: Welcome modal supports both light and dark themes
- [ ] **THME-04**: All onboarding text is Persian with Vazirmatn font

### Persistence & Relaunch

- [ ] **PERS-01**: Onboarding completion persists to localStorage via Jotai atomWithStorage
- [ ] **PERS-02**: Returning users never see welcome modal automatically
- [ ] **PERS-03**: "?" help button in header allows any user to relaunch the tour anytime
- [ ] **PERS-04**: Persistence uses versioned key (e.g., plan-onboarding-v1) for future reset capability

### Technical Foundation

- [ ] **TECH-01**: driver.js v1.4.0 installed as only new dependency (~5kb gzipped)
- [ ] **TECH-02**: driver.js loaded via dynamic import (not bundled for returning users)
- [ ] **TECH-03**: CSS overrides file handles dark mode + RTL styling for driver.js elements
- [ ] **TECH-04**: Onboarding components isolated in src/components/onboarding/ folder
- [ ] **TECH-05**: Tour step definitions in separate pure data file (steps.ts)
- [ ] **TECH-06**: Onboarding elements excluded from schedule image export (data-export-exclude)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Tour

- **ETOU-01**: Contextual mini-tours per feature (e.g., "how to export", "how to check exam conflicts") triggered from help menu
- **ETOU-02**: "What's New" tour after app version updates showing only new features
- **ETOU-03**: Interactive "try it" step that pauses tour and prompts user to perform slot-drag filter

### Visual Polish

- **VPOL-01**: Welcome carousel slides with lightweight SVG/icon illustrations per feature
- **VPOL-02**: Persian digit formatting in progress text via onPopoverRender callback

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mandatory/unskippable tour | #1 cause of onboarding rage-quit; always skippable |
| Long tour (6+ steps) | 50%+ abandon after step 4; limit to 4-5 steps |
| Auto-advancing slides | Users read at different speeds; manual navigation only |
| Video tutorials | Loading overhead, not skimmable, poor RTL support |
| Full-screen takeover modal | Blocks UI, creates trapped feeling |
| Onboarding checklist | Overkill for single-purpose tool with no account system |
| AI-personalized onboarding | Over-engineering for static client-side app |
| Tooltips on every element | Coach mark abuse; only highlight non-obvious features |
| Building tour from scratch | driver.js provides spotlight/nav/scroll for ~5kb; custom build not worth 2kb savings |
| Per-feature contextual help | Adds ongoing UI clutter outside the tour |
| A/B testing of flows | No analytics infrastructure |
| Non-Persian localization | App is Persian-only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WELC-01 | Phase 2 | Pending |
| WELC-02 | Phase 2 | Pending |
| WELC-03 | Phase 2 | Pending |
| WELC-04 | Phase 2 | Pending |
| WELC-05 | Phase 2 | Pending |
| TOUR-01 | Phase 3 | Pending |
| TOUR-02 | Phase 3 | Pending |
| TOUR-03 | Phase 3 | Pending |
| TOUR-04 | Phase 3 | Pending |
| TOUR-05 | Phase 3 | Pending |
| TOUR-06 | Phase 3 | Pending |
| TOUR-07 | Phase 3 | Pending |
| ADPT-01 | Phase 3 | Pending |
| ADPT-02 | Phase 2 | Pending |
| ADPT-03 | Phase 3 | Pending |
| THME-01 | Phase 1 | Pending |
| THME-02 | Phase 1 | Pending |
| THME-03 | Phase 2 | Pending |
| THME-04 | Phase 1 | Pending |
| PERS-01 | Phase 1 | Pending |
| PERS-02 | Phase 4 | Pending |
| PERS-03 | Phase 4 | Pending |
| PERS-04 | Phase 1 | Pending |
| TECH-01 | Phase 1 | Pending |
| TECH-02 | Phase 1 | Pending |
| TECH-03 | Phase 1 | Pending |
| TECH-04 | Phase 1 | Pending |
| TECH-05 | Phase 1 | Pending |
| TECH-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation*
