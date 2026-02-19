# Domain Pitfalls: Onboarding & Coach Marks

**Domain:** User onboarding / coach marks for a Persian (RTL) course scheduling SPA
**Researched:** 2026-02-19
**Stack:** driver.js v1.4.0 + custom welcome modal

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: RTL Popover Layout Broken Out of the Box

**What goes wrong:** driver.js popovers render with LTR text alignment, LTR button order (Previous on left, Next on right), and LTR close button positioning. In an RTL app, the text reads correctly (browser handles that) but the visual layout feels wrong -- navigation buttons are backwards for Persian users.

**Why it happens:** driver.js has no built-in RTL support. An [open PR (#569)](https://github.com/kamranahmedse/driver.js/pull/569) exists since May 2025 but has not been merged. The library's CSS uses `left`/`right` positioning, not logical properties (`inset-inline-start`/`inset-inline-end`).

**Consequences:** Users accustomed to RTL interfaces will find the tour confusing. "Next" appears where they expect "Previous" to be.

**Prevention:**
- Apply RTL CSS overrides in `driver-overrides.css` on day one (see ARCHITECTURE.md for the full CSS)
- Test every step in RTL from the start -- do not build in LTR and convert later
- Use `[dir="rtl"]` selector, not `:lang(fa)`, for the overrides to match the project's existing RTL approach
- Verify arrow positioning for each tooltip placement (top/bottom/left/right) in RTL

**Detection:** Navigation buttons feel "backwards" during first manual test. Arrow tips point in unexpected directions.

### Pitfall 2: Z-Index Collision with Mobile Bottom Sheet

**What goes wrong:** On mobile, the course search bottom sheet (z-50) and the mobile FAB button (z-50) compete with driver.js overlay. If the bottom sheet is open when the tour starts, the tour overlay may render behind it, or clicking "next" in the tour accidentally triggers bottom sheet interactions underneath.

**Why it happens:** Barname's mobile UI uses z-50 for the bottom sheet backdrop and content. Driver.js uses z-10000 by default, which should be fine. However, the **highlighted target element** is temporarily elevated by driver.js, and if that element is inside a stacking context created by the bottom sheet, elevation may not work as expected.

**Consequences:** Tour appears partially broken on mobile. Users cannot interact with tour controls, or accidentally dismiss the bottom sheet.

**Prevention:**
- Close the mobile bottom sheet before starting the tour
- In `launchTour()`, programmatically close any open modals/sheets first
- Test the tour on mobile with the bottom sheet both open and closed
- If targeting the FAB button, ensure the bottom sheet is closed and the FAB is visible

**Detection:** Test on actual mobile device (not just responsive mode). Try starting the tour with the bottom sheet open.

### Pitfall 3: FullCalendar Target Elements Unstable

**What goes wrong:** Coach marks that target FullCalendar internal elements (`.fc-timegrid-slot`, `.fc-event`, `.fc-col-header-cell`) break when courses are added/removed (FullCalendar re-renders its DOM) or when the user switches between normal and transposed calendar views.

**Why it happens:** FullCalendar manages its own DOM lifecycle. Its internal class names are not a stable API. The transposed calendar (`TransposedCalendar`) has completely different DOM structure.

**Consequences:** driver.js shows "element not found" behavior -- either the tour breaks, skips the step, or highlights the wrong area.

**Prevention:**
- NEVER target FullCalendar internal elements. Always target the wrapper `<div>` with `data-tour="calendar"` attribute
- Highlight the general calendar area, not specific time slots or events
- Add `data-tour` attributes only to elements YOU control (your React component wrappers), not third-party library internals

**Detection:** Add a course during the tour. If the spotlight shifts or disappears, the target is too specific.

### Pitfall 4: Tour Captured in JPG Export

**What goes wrong:** If a user somehow triggers the JPG export while the tour overlay is visible (unlikely but possible via keyboard shortcut or "?" re-trigger), the exported image includes driver.js overlay, spotlight, and tooltip.

**Why it happens:** `html-to-image` (the project's export library) captures the DOM as-is. Driver.js injects overlay elements into `document.body`.

**Consequences:** Exported schedule image is unusable -- has a dark overlay and tooltip obscuring the calendar.

**Prevention:**
- Dismiss the tour before export: in the export handler, check if a tour is active and call `driverObj.destroy()` first
- Alternatively, driver.js overlay elements could be excluded via the export library's `filter` option (exclude elements with `driver-*` classes)
- Simplest approach: disable export buttons while tour is active

**Detection:** Try exporting during a tour in development.

### Pitfall 5: Onboarding Annoys Returning Users

**What goes wrong:** The tour appears on every visit, or appears for users who already know the app. Power users (tech-savvy university students) get frustrated.

**Why it happens:** localStorage persistence is not implemented correctly, or the completion flag uses `sessionStorage` (resets per session), or the key is not versioned (preventing re-trigger for new features).

**Consequences:** Users associate the app with annoyance. Negative word-of-mouth during registration season.

**Prevention:**
- Use `atomWithStorage` with a versioned key (e.g., `plan-onboarding-v1`)
- Provide skip button on EVERY step and on the welcome modal
- Provide "?" button to replay -- removes anxiety of "I can never see this again"
- Never auto-start the coach marks after the welcome modal. Let the user explicitly click "Start Tour"
- Limit welcome carousel to 3-4 slides. Limit tour to 5-6 steps

**Detection:** Complete tour, refresh page, verify tour does not reappear.

## Moderate Pitfalls

### Pitfall 6: driver.js CSS Conflicts with Tailwind CSS v4

**What goes wrong:** Tailwind CSS v4's CSS layer system or CSS reset may override driver.js default styles, causing popovers to render without backgrounds, borders, or proper spacing.

**Prevention:**
- Import `driver.js/dist/driver.css` BEFORE the Tailwind CSS import, or use `@layer` to ensure driver.js styles have correct specificity
- Test immediately after installing driver.js -- if the popover looks broken, it is a CSS ordering issue
- Custom overrides in `driver-overrides.css` should use sufficient specificity (e.g., `.barname-tour.driver-popover` rather than just `.driver-popover`)

### Pitfall 7: Scroll Offset Not Accounting for Sticky Header

**What goes wrong:** When driver.js scrolls to a target element below the fold (e.g., exams table), it scrolls the element to the top of the viewport, but the sticky header (64px) covers part of it.

**Prevention:**
- Configure driver.js `scrollIntoViewOptions` with appropriate offset
- Test with steps targeting below-the-fold elements (exams table, export buttons when page is scrolled)
- If driver.js default scroll behavior is insufficient, use `onHighlightStarted` callback to manually scroll with offset

### Pitfall 8: Tour Breaks When User Interacts Mid-Tour

**What goes wrong:** User clicks a schedule tab, toggles dark mode, or adds/removes a course during the tour. The target element for the current or next step may no longer exist or may have moved.

**Prevention:**
- driver.js recalculates element position on each step transition, so moving elements are handled
- For disappearing elements (e.g., user deletes a course card that is the current target), driver.js will show the popover without a highlight -- not ideal but not catastrophic
- Keep tour steps targeting stable, always-present elements (search bar, calendar wrapper, tab bar, export buttons)
- Avoid targeting dynamic content (specific course cards, specific events)

### Pitfall 9: Persian Digit Formatting in Progress Text

**What goes wrong:** Progress text shows "2 of 5" with Western digits instead of Persian digits, breaking the all-Persian UI contract.

**Prevention:**
- driver.js `progressText` accepts a template string `{{current}} از {{total}}` but the numbers will be Western digits
- Use `onPopoverRender` callback to find the progress text element and replace with Persian digits via `toPersianDigits()`
- Alternatively, set `showProgress: false` and render a custom progress indicator in the description HTML

## Minor Pitfalls

### Pitfall 10: Welcome Modal Not Dismissible by Clicking Backdrop

**What goes wrong:** Users expect to close modals by clicking the backdrop (semi-transparent overlay behind the modal). If this is not implemented, the modal feels "sticky."

**Prevention:** Add onClick handler to the backdrop element that dismisses the modal. Standard React pattern.

### Pitfall 11: Keyboard Navigation Incomplete

**What goes wrong:** Escape key does not dismiss the tour, or Tab key does not cycle through tour buttons.

**Prevention:** driver.js has built-in `keyboardControl: true` (enabled by default). Verify Escape dismisses and arrow keys do not conflict with FullCalendar's keyboard shortcuts.

### Pitfall 12: Dynamic Import Flicker

**What goes wrong:** When lazy-loading driver.js with `await import('driver.js')`, there is a brief delay before the tour appears, causing a noticeable gap after the user clicks "Start Tour."

**Prevention:**
- Preload driver.js during the welcome modal display: `import('driver.js')` (fire and forget) while the user is reading slides
- The CSS file should also be preloaded: `import('driver.js/dist/driver.css')`
- By the time the user clicks "Start Tour," the module is already cached

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| driver.js installation and CSS setup | Tailwind CSS v4 overriding driver.js styles (Pitfall 6) | Test popover appearance immediately after install |
| RTL overrides | Popover layout reversed (Pitfall 1) | Write and test RTL CSS before building any steps |
| Tour step definitions | FullCalendar internal targeting (Pitfall 3) | Use data-tour attributes only |
| Mobile testing | Bottom sheet z-index conflict (Pitfall 2) | Close sheets before tour; test on real device |
| State persistence | Returning user annoyance (Pitfall 5) | Use versioned atomWithStorage key |
| Export integration | Tour captured in export (Pitfall 4) | Dismiss tour before export or filter overlay elements |
| Polish and testing | Scroll offset, dark mode, Persian digits (Pitfalls 7, 8, 9) | Test every step in both modes and viewports |

## "Looks Done But Isn't" Checklist

- [ ] RTL: Test ALL steps, not just the first one (arrow/button positions may break on specific placements)
- [ ] Dark mode: Toggle dark mode DURING the tour, not just before starting it
- [ ] Mobile: Test on actual device, not just browser responsive mode
- [ ] Returning user: Complete tour, refresh, verify no re-trigger
- [ ] Empty state: Verify tour works when schedule is empty (first-time user scenario)
- [ ] Export: Verify JPG export does NOT capture tour overlay
- [ ] Persian digits: Verify progress text uses Persian numerals
- [ ] Keyboard: Verify Escape dismisses tour, Tab cycles through buttons
- [ ] Mid-tour interaction: Add/remove a course during tour, verify no crash

## Sources

- [driver.js RTL PR #569](https://github.com/kamranahmedse/driver.js/pull/569) -- RTL support status
- [driver.js Theming Docs](https://driverjs.com/docs/theming) -- CSS class names for overrides
- [NN/g: Onboarding Tutorials vs. Contextual Help](https://www.nngroup.com/articles/onboarding-tutorials/) -- UX research on tour length
- [Floating UI RTL scrollbar issue #976](https://github.com/floating-ui/floating-ui/issues/976) -- RTL is systemically tricky
- Barname codebase analysis (z-index map, FullCalendar integration, export logic) -- Integration risks

---
*Pitfalls research for: Onboarding & Coach Marks in Barname (driver.js approach)*
*Researched: 2026-02-19*
