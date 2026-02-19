# Phase 4: Integration & Polish - Research

**Researched:** 2026-02-19
**Domain:** React event wiring, header UI button, html-to-image export filtering, driver.js DOM structure, Jotai state integration
**Confidence:** HIGH

## Summary

Phase 4 is a pure integration phase with no new dependencies or architectural decisions. All building blocks exist from Phases 1-3: the `WelcomeModal` component (Phase 2) already has an `onStartTour` prop that calls a placeholder `console.log` in `App.tsx`; the `startTour()` function (Phase 3) is fully implemented and barrel-exported from `src/components/onboarding/index.ts`; and the `ExportButtons.tsx` already has an `exportFilter` function that excludes elements with `data-export-exclude` attribute.

The three tasks are: (1) Replace the `handleStartTour` placeholder in `App.tsx` line 87-89 with a call to the real `startTour()` function from `src/components/onboarding/tour.ts`; (2) Add a "?" help button to the header in `App.tsx` that calls `startTour()` on click, styled consistently with the adjacent dark mode toggle and GitHub link buttons; (3) Verify that driver.js overlay/popover elements are excluded from the `#schedule-export-area` capture -- they are appended to `document.body`, not inside the export area, so they are inherently excluded by `html-to-image`'s DOM-tree-based cloning. The `WelcomeModal` (also a `fixed` overlay on `document.body`) is similarly outside the export area.

**Primary recommendation:** Wire the existing `handleStartTour` function to call `startTour()`, add a "?" button to the header's button group, and add a defensive `data-export-exclude` attribute to the WelcomeModal's root div as a safety net. No new libraries, no complex logic -- this is purely connecting existing pieces.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | ^19.2.0 (installed) | Event handlers, component rendering | Already the framework |
| Jotai | ^2.17.1 (installed) | `onboardingCompletedAtom` for returning user detection | Already handles persistence |
| driver.js | 1.4.0 (installed) | `startTour()` function already complete | Already configured in Phase 3 |
| html-to-image | ^1.11.13 (installed) | Export with `filter` option | Already used by ExportButtons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | -- | -- | Zero new dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline "?" button in header | Floating action button for help | FAB would conflict with existing mobile "+" FAB. Header button is consistent with existing dark mode and GitHub buttons |

**Installation:**
```bash
# No installation needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  App.tsx                              # MODIFY: wire handleStartTour, add "?" button to header
  components/
    onboarding/
      index.ts                         # EXISTS: already exports startTour
      tour.ts                          # EXISTS: startTour(onComplete?) fully implemented
      WelcomeModal.tsx                 # EXISTS: onStartTour prop, renders when !completed
    ExportButtons.tsx                  # EXISTS: exportFilter already handles data-export-exclude
```

No new files needed. All changes are modifications to `App.tsx`.

### Pattern 1: Wiring WelcomeModal's onStartTour to Real startTour()
**What:** Replace the placeholder `handleStartTour` in App.tsx with a call to the imported `startTour()` function from the onboarding barrel.
**When to use:** Immediately -- this is the primary integration point.

```typescript
// src/App.tsx — current placeholder (line 87-89):
function handleStartTour() {
  console.log('Tour requested -- will be wired in Phase 3/4');
}

// Replace with:
import { startTour } from '@/components/onboarding';

function handleStartTour() {
  startTour();
}
```

**Key detail:** The `WelcomeModal.handleStartTour()` already calls `setCompleted(true)` (dismisses modal) BEFORE calling `onStartTour()`. So the modal unmounts before the tour starts. The `startTour()` function does not need to handle modal dismissal -- it is already dismissed. The `onComplete` callback of `startTour()` is optional and not needed here because `onboardingCompletedAtom` is already set to `true` by the WelcomeModal's `dismiss()` call.

**Confidence: HIGH** -- Verified by reading WelcomeModal.tsx lines 20-31 and tour.ts lines 17-64.

### Pattern 2: Help Button in Header
**What:** A "?" button styled identically to the dark mode toggle button, placed in the header's button group.
**When to use:** To allow any user (including returning users who have already completed onboarding) to relaunch the tour.

```tsx
// Place in the header's flex button group, between GitHub link and dark mode toggle
<button
  onClick={() => startTour()}
  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-600 dark:text-gray-300"
  title="راهنمای استفاده"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
</button>
```

**Styling source:** The `className` is copied verbatim from the dark mode toggle button (App.tsx line 115). The SVG uses Lucide's "help-circle" icon at 18x18 matching the other header icons. The `title` attribute follows the Persian convention used by adjacent buttons.

**Confidence: HIGH** -- Pattern copied from existing header button at App.tsx line 112-123.

### Pattern 3: Export Exclusion via DOM Scope
**What:** The `html-to-image` library captures the DOM tree starting from the element passed to `toJpeg()`/`toPng()`. Any elements outside this tree are automatically excluded.
**When to use:** Understanding why driver.js overlays don't need special handling.

```
DOM tree at export time:

document.body
├── div#root (React app)
│   └── div (App component)
│       ├── header (sticky header)
│       ├── div#schedule-export-area    ← THIS is what html-to-image captures
│       │   └── WeeklySchedule
│       └── WelcomeModal (fixed overlay, z-50)  ← OUTSIDE export area
│
├── .driver-popover (appended by driver.js to body)  ← OUTSIDE export area
├── svg.driver-overlay (appended by driver.js to body)  ← OUTSIDE export area
└── #driver-dummy-element (appended by driver.js to body)  ← OUTSIDE export area
```

**Key insight:** `ExportButtons.getExportElement()` returns `document.getElementById('schedule-export-area')`, which is a `div` deep inside the React tree. `html-to-image` clones ONLY that subtree. Driver.js elements are siblings of the React root on `document.body`, not descendants of `#schedule-export-area`. Therefore they are inherently excluded from the capture -- no filter logic needed.

The existing `exportFilter` function in ExportButtons.tsx (line 20-22) already filters out any element with `data-export-exclude` attribute. This handles elements WITHIN the export area (like the legend and filter UI in WeeklySchedule). It does NOT need to handle driver.js elements because they are outside the capture scope.

**Confidence: HIGH** -- Verified by:
1. `driver.js/dist/driver.js.mjs` line 119: `document.body.appendChild(o)` (overlay SVG)
2. `driver.js/dist/driver.js.mjs` line 248: `document.body.appendChild(t.wrapper)` (popover)
3. `driver.js/dist/driver.js.mjs` line 154: `document.body.appendChild(o)` (dummy element)
4. `html-to-image/lib/clone-node.js` line 277: filter runs on descendants of passed root only
5. ExportButtons.tsx line 17: captures only `#schedule-export-area`

### Pattern 4: Defensive data-export-exclude on WelcomeModal
**What:** Although the WelcomeModal is a `fixed` positioned overlay that renders outside `#schedule-export-area` in the DOM tree, add `data-export-exclude` to its root div as a safety net.
**When to use:** Belt-and-suspenders approach. Costs nothing, prevents edge cases.

```tsx
// WelcomeModal.tsx root div, add data-export-exclude
<div data-export-exclude className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
```

**Confidence: HIGH** -- `data-export-exclude` is already the established pattern (used in WeeklySchedule.tsx lines 174, 188, 203).

### Anti-Patterns to Avoid

- **NEVER call `startTour()` in a `useEffect`:** The tour must be triggered by user action (button click), never on mount or state change. Calling it in `useEffect` could trigger before the DOM is ready or cause multiple tour instances.

- **NEVER add a separate "help" page/route:** The app is a single-page static app with no router. The "?" button simply relaunches the same tour inline.

- **NEVER create a custom overlay exclusion system:** The export already works correctly due to DOM scope. Don't add complexity to "solve" a problem that doesn't exist.

- **NEVER close/interrupt the tour from the "?" button if already running:** driver.js does not support running multiple tours simultaneously. If `startTour()` is called while a tour is already active, driver.js creates a new instance and the old one becomes orphaned. However, in practice this is extremely unlikely (user would have to click "?" while already in a tour). The simplest mitigation is: don't worry about it. If needed later, check `document.querySelector('.driver-active')` before starting.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tour launch on button click | Custom tour manager/context provider | Direct `startTour()` function call | The function is already stateless and imperative. No need for React state management around it |
| Export overlay exclusion | Custom CSS hiding before capture | DOM scope (html-to-image only captures subtree) | Driver.js elements are on document.body, outside capture scope |
| Returning user detection | Custom localStorage check | `onboardingCompletedAtom` (atomWithStorage) | Already implemented in Phase 1. WelcomeModal already checks `if (completed) return null` |

**Key insight:** Every required capability already exists. This phase is pure wiring, not building.

## Common Pitfalls

### Pitfall 1: Tour Starts Before Modal Fully Unmounts
**What goes wrong:** The `startTour()` function runs while the WelcomeModal is still visible, causing driver.js to fight with the modal for z-index dominance. The tour overlay appears behind the modal backdrop.
**Why it happens:** React state updates (`setCompleted(true)`) are asynchronous. Calling `onStartTour()` immediately after `setCompleted(true)` might execute before React re-renders and unmounts the modal.
**How to avoid:** In practice, `setCompleted(true)` triggers a synchronous re-render in React 18+ (when called from an event handler). The modal returns `null` on the next render, which happens before `onStartTour()` runs the `driver.drive()` call. However, if this ever causes issues, wrap `startTour()` in `requestAnimationFrame(() => startTour())` to delay until the next paint.
**Warning signs:** Tour overlay appears behind a semi-transparent backdrop. First tour step is not interactive.

### Pitfall 2: Help Button Missing on Mobile
**What goes wrong:** The "?" button is hidden on mobile because it's inside a `hidden sm:block` container.
**Why it happens:** Developer places the button inside the `<div className="hidden sm:block">` wrapper that contains `<ExportButtons />`.
**How to avoid:** Place the "?" button OUTSIDE the `hidden sm:block` wrapper, alongside the dark mode toggle and GitHub link which are always visible. The button group at App.tsx line 99 (`<div className="flex items-center gap-2 sm:gap-3 mr-auto sm:mr-0">`) is always visible on all screen sizes.
**Warning signs:** "?" button not visible on mobile viewport. Tour cannot be relaunched on mobile.

### Pitfall 3: Importing startTour but Not Using It Correctly for Help Button
**What goes wrong:** Developer imports `startTour` in App.tsx but creates a new `handleHelpClick` function that doesn't properly call it, or passes wrong arguments.
**Why it happens:** Over-engineering the integration.
**How to avoid:** Call `startTour()` directly in the onClick handler. No wrapper needed. The function accepts an optional `onComplete` callback which is not needed for the help button (the user has already completed onboarding; we don't need to set the atom again).
**Warning signs:** Help button click does nothing, or console errors appear.

### Pitfall 4: Double Onboarding Atom Write
**What goes wrong:** Both WelcomeModal's `dismiss()` AND `startTour()`'s `onComplete` callback try to set `onboardingCompletedAtom` to `true`.
**Why it happens:** WelcomeModal sets it in `dismiss()` (line 21). If `startTour()` is called with an `onComplete` callback that also sets the atom, it writes twice.
**How to avoid:** Don't pass an `onComplete` callback to `startTour()` when called from WelcomeModal's `handleStartTour`. The atom is already set by `dismiss()`. When called from the "?" help button, the atom is already `true` (user is a returning visitor), so calling `startTour()` without `onComplete` is correct.
**Warning signs:** No visible issue (writing `true` twice is idempotent), but unnecessary work.

## Code Examples

### Complete handleStartTour Replacement
```typescript
// src/App.tsx — replace the placeholder
import { startTour, WelcomeModal } from '@/components/onboarding';

// Inside App component:
function handleStartTour() {
  startTour();
}
```
**Source:** Current placeholder at App.tsx line 87-89. `startTour` is already barrel-exported from `src/components/onboarding/index.ts` line 3.

### Complete "?" Help Button
```tsx
// src/App.tsx — add to the header button group (inside the flex container at line 99)
// Place between the GitHub link (line 103-111) and dark mode toggle (line 112-123)
<button
  onClick={() => startTour()}
  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-600 dark:text-gray-300"
  title="راهنمای استفاده"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
</button>
```
**Source:** Styling from dark mode toggle button at App.tsx line 112-123. SVG is Lucide `help-circle` icon (same icon library style as existing icons).

### Import Update for App.tsx
```typescript
// Current import (App.tsx line 10):
import { WelcomeModal } from '@/components/onboarding';

// Updated import:
import { WelcomeModal, startTour } from '@/components/onboarding';
```

### Verification That Export Is Clean
The export already works correctly because:
1. `ExportButtons.tsx` line 17 captures only `#schedule-export-area`
2. Driver.js appends overlays to `document.body` (outside `#schedule-export-area`)
3. WelcomeModal renders as a `fixed` overlay at the React app root level (outside `#schedule-export-area`)
4. `html-to-image` `filter` callback (line 20-22) provides additional safety for any elements with `data-export-exclude` within the export area

No code changes needed in ExportButtons.tsx for this requirement.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| html2canvas for export | html-to-image for export | Already migrated in codebase | html-to-image has better `filter` option typed as `(domNode: HTMLElement) => boolean` |
| Custom overlay exclusion via CSS class toggling | DOM scope-based exclusion (capture subtree) | N/A (always how html-to-image works) | No need to hide/show elements before/after capture |

**Deprecated/outdated:**
- The CLAUDE.md still references `html2canvas` but the actual code uses `html-to-image`. This discrepancy has no impact on implementation.

## Open Questions

1. **Where exactly to place the "?" button in the header?**
   - What we know: The header has a flex container with: semester label, units badge, GitHub link, dark mode toggle, ExportButtons. The GitHub link and dark mode toggle are always visible. ExportButtons is `hidden sm:block`.
   - What's unclear: Should "?" go before or after the dark mode toggle? Before or after the GitHub link?
   - Recommendation: Place it between the GitHub link and the dark mode toggle. This groups "informational" buttons (GitHub, help) together and puts the dark mode toggle at the far end where users expect settings-type controls. LOW priority decision -- any position works.

2. **Should the "?" button be hidden during the tour?**
   - What we know: If a user clicks "?" while the tour is already running, driver.js creates a new tour instance. The old instance may not be properly destroyed.
   - What's unclear: How driver.js handles concurrent instances.
   - Recommendation: Don't hide it. The scenario is extremely unlikely. If it becomes an issue, add a simple guard: `if (document.querySelector('.driver-active')) return;` before `startTour()`. This is a LOW priority concern.

## Sources

### Primary (HIGH confidence)
- Barname codebase: `src/App.tsx` (header layout, handleStartTour placeholder, WelcomeModal integration), `src/components/ExportButtons.tsx` (export filter, capture target), `src/components/onboarding/tour.ts` (startTour function), `src/components/onboarding/WelcomeModal.tsx` (onStartTour prop, dismiss flow), `src/components/onboarding/index.ts` (barrel exports)
- `driver.js/dist/driver.js.mjs` lines 119, 154, 248 (body.appendChild confirms DOM placement)
- `html-to-image/lib/clone-node.js` line 277 (filter runs on subtree only)
- `html-to-image/lib/types.d.ts` (Options.filter type definition)

### Secondary (MEDIUM confidence)
- Phase 2 Research (02-RESEARCH.md) — WelcomeModal architecture and dismiss flow
- Phase 3 Research (03-RESEARCH.md) — startTour() configuration and lifecycle

### Tertiary (LOW confidence)
- None — all findings verified against source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new dependencies. Everything already installed and configured.
- Architecture: HIGH — All patterns verified against actual codebase. This phase is pure wiring of existing code.
- Pitfalls: HIGH — Modal-to-tour transition timing verified by reading React event handler execution model and WelcomeModal.tsx dismiss flow. Export exclusion verified by tracing DOM tree structure.

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (no external dependencies to go stale)
