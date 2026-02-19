# Research Summary: Onboarding & Coach Marks

**Domain:** User onboarding for course scheduling SPA
**Researched:** 2026-02-19
**Overall confidence:** HIGH

## Executive Summary

The React onboarding/tour library ecosystem is in a fragmented state as of early 2026. The two most popular React-specific libraries -- react-joyride and @reactour/tour -- are both broken with React 19 due to their reliance on deprecated React DOM APIs. React-joyride uses removed `unmountComponentAtNode` API; its "next" branch exists but has no stable release. Reactour merged a React 19 fix in May 2025 but never published it to npm (last npm release was 2022). The two major framework-agnostic alternatives -- Shepherd.js and Intro.js -- both switched to AGPL licensing, requiring commercial licenses for non-open-source use.

This leaves **driver.js** as the clear winner for this project. It is MIT-licensed, framework-agnostic (zero React dependency, zero React version coupling), tiny (~5kb gzipped with zero dependencies), and actively maintained (v1.4.0 released Nov 2025, 22k+ GitHub stars). Its framework-agnostic nature, which was historically seen as a downside (no React bindings), is now its greatest strength -- it will never break due to React version changes.

The main limitation of driver.js is lack of built-in RTL support (an open PR #569 from May 2025 exists but is unmerged). However, RTL is achievable through ~15-20 lines of CSS overrides targeting driver.js class names. Dark mode is similarly handled through CSS class targeting that aligns with the project's existing `.dark` class pattern. Neither limitation is a blocker.

For the welcome carousel modal, building custom with React + Tailwind is the right approach. A 3-4 slide carousel is approximately 100-150 lines of code and does not warrant a library dependency. This keeps the bundle minimal and provides full control over RTL layout and dark mode styling.

## Key Findings

**Stack:** driver.js v1.4.0 (only new dependency) + custom welcome modal in React/Tailwind + Jotai atomWithStorage for persistence
**Architecture:** Imperative driver.js launch function, not a React component wrapper. data-tour attributes on existing elements as stable selectors. CSS override file for dark mode + RTL
**Critical pitfall:** RTL popover layout needs CSS overrides on day one. FullCalendar internal elements must never be targeted (use wrapper divs with data-tour attributes)

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation** -- Install driver.js, create CSS overrides (dark mode + RTL), add data-tour attributes to existing components, set up Jotai atoms
   - Addresses: persistence, RTL styling, dark mode styling, element targeting
   - Avoids: RTL pitfall (tested early), z-index conflicts (verified), FullCalendar targeting (data-tour convention established)

2. **Welcome Modal** -- Build custom carousel modal with 3-4 slides, skip button, "Start Tour" CTA, responsive layout
   - Addresses: first-visit orientation, mobile-friendly design
   - Avoids: over-engineering (no carousel library), forced onboarding (always skippable)

3. **Coach Marks Tour** -- Configure driver.js tour with 4-5 steps, device-aware filtering, Persian button text, progress indicator
   - Addresses: core coach marks functionality, device adaptation
   - Avoids: too many steps (limited to 5), FullCalendar internal targeting (uses wrapper selectors)

4. **Integration & Polish** -- Wire up in App.tsx, add "?" help button, test all scenarios (dark mode, RTL, mobile, empty state, export)
   - Addresses: help button, edge cases, export conflict
   - Avoids: returning user annoyance (versioned persistence), export capture (tour dismissed before export)

**Phase ordering rationale:**
- Foundation must come first because CSS overrides and data-tour attributes are prerequisites for everything visual
- Welcome modal before coach marks because the modal is the entry point to the tour (user clicks "Start Tour")
- Integration last because it connects the pieces and is where edge cases are discovered

**Research flags for phases:**
- Phase 1 (Foundation): RTL CSS overrides need manual testing with every tooltip placement direction. May need iteration.
- Phase 2 (Welcome Modal): Standard React pattern, unlikely to need deeper research
- Phase 3 (Coach Marks): Persian digit formatting in progress text may require `onPopoverRender` workaround -- low risk but not trivial
- Phase 4 (Integration): Mobile bottom sheet z-index interaction needs testing on real device. Export guard needs verification with html-to-image library.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (driver.js) | **HIGH** | React 19 compat verified via GitHub issues; MIT license verified; bundle size from official docs; alternatives systematically eliminated |
| Features | **HIGH** | Table stakes well-established from UX research; anti-features clearly identified; scope bounded |
| Architecture | **HIGH** | driver.js API verified from official docs; imperative pattern is straightforward; data-tour convention is proven |
| Pitfalls | **HIGH** | RTL limitation verified (open PR #569); z-index values from codebase analysis; FullCalendar DOM instability from library documentation |

## Gaps to Address

- **RTL fine-tuning:** The CSS overrides are based on documented class names but the exact arrow positioning in RTL needs visual testing. The open PR #569 may merge and provide built-in support, reducing the CSS override burden.
- **Persian progress text:** driver.js renders progress text with Western digits. The `onPopoverRender` workaround is documented but needs implementation verification -- it may be cleaner to disable built-in progress and render a custom indicator in the description HTML.
- **Tailwind CSS v4 + driver.js CSS ordering:** Tailwind v4's layer system may affect driver.js default styles. Needs testing immediately after installation to catch conflicts early.
- **driver.js scroll behavior with sticky header:** The 64px sticky header may require scroll offset configuration. driver.js has `scrollIntoViewOptions` but the exact configuration needs empirical testing.
- **Content authoring:** All Persian copy for carousel slides and tour tooltips needs to be written. This is a content task, not a technical task, but it gates the final implementation.
