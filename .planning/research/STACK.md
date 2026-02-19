# Technology Stack: Onboarding & Coach Marks

**Project:** Barname (plan.csut.ir) -- Course Scheduling SPA
**Researched:** 2026-02-19
**Mode:** Ecosystem research for onboarding/coach marks in React 19 SPA

## Executive Recommendation

**Use driver.js (v1.4.0) for coach marks/tours + build the welcome modal in-house with plain React.**

Driver.js is the only viable option that is (a) MIT-licensed, (b) framework-agnostic (no React version conflicts), (c) tiny (~5kb gzipped, zero dependencies), and (d) actively maintained. The welcome carousel modal is simple enough to build with existing Tailwind CSS -- adding a library for it would be over-engineering.

## Recommended Stack

### Coach Marks / Product Tour

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **driver.js** | 1.4.0 | Step-by-step spotlight tour highlighting real UI elements | MIT license, 5kb gzipped, zero dependencies, framework-agnostic (no React 19 peer dep issues), CSS-based theming (dark mode via CSS override), `onPopoverRender` hook for full DOM control, 22k+ GitHub stars |

### Welcome Modal / Carousel

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Custom React component** | N/A | Welcome carousel modal shown on first visit | A 3-4 slide carousel is ~50 lines of React + Tailwind. No library needed. Keeps bundle minimal and gives full RTL/dark mode control with zero dependency risk |

### State Persistence (Onboarding Completion)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Jotai `atomWithStorage`** | (already in project) | Track whether user has completed onboarding, which tours they have seen | Already used for all persistent state in the app. No new dependency needed |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| driver.js | 1.4.0 | Coach marks, element highlighting, step-by-step tours | For any feature tour or contextual help |
| (none additional) | -- | Welcome modal is pure React + Tailwind | First-visit onboarding carousel |

## Why driver.js -- Detailed Rationale

### 1. React 19 Compatibility (CRITICAL)

The project uses React 19.2.0. This eliminates most dedicated React tour libraries:

| Library | React 19 Status | Source |
|---------|-----------------|--------|
| **react-joyride** | BROKEN. Uses removed `unmountComponentAtNode` API. v3 "next" branch exists but unstable, no stable release as of Feb 2026 | [GitHub Issue #1122](https://github.com/gilbarbara/react-joyride/issues/1122) |
| **@reactour/tour** | BROKEN. `Invalid hook call` error with React 19. Fix merged in repo May 2025 but never published to npm (last npm release from 2022) | [GitHub Issue #659](https://github.com/elrumordelaluz/reactour/issues/659) |
| **driver.js** | WORKS. Zero React dependency -- it is vanilla TypeScript. No peer deps, no hook conflicts, no version coupling | [GitHub repo](https://github.com/kamranahmedse/driver.js) |

**Confidence: HIGH** -- Verified via GitHub issues with maintainer responses.

### 2. Bundle Size (IMPORTANT for static site)

| Library | Size (min+gzip) | Dependencies |
|---------|-----------------|--------------|
| **driver.js** | ~5kb | 0 |
| react-joyride | ~12kb+ | react-floater, popper, deep-diff, etc. |
| @reactour/tour | ~15kb+ | @reactour/mask, @reactour/popover, @reactour/utils |
| shepherd.js | ~25kb+ | @floating-ui |
| intro.js | ~10kb | 0 |

Driver.js is 2-5x smaller than alternatives. For a static site where every kb matters, this is significant.

**Confidence: MEDIUM** -- Size from official docs/GitHub README, not independently verified on bundlephobia.

### 3. License (IMPORTANT)

| Library | License | Commercial Use |
|---------|---------|----------------|
| **driver.js** | MIT | Free, unrestricted |
| react-joyride | MIT | Free, unrestricted |
| @reactour/tour | MIT | Free, unrestricted |
| **shepherd.js** | **AGPL-3.0** | **Requires commercial license for commercial use** |
| **intro.js** | **AGPL** | **Requires commercial license ($9.99+) for commercial use** |

Shepherd.js and Intro.js are eliminated. Even though Barname is an educational tool, AGPL's copyleft requirements make them unsuitable for a project that may not want to open-source everything.

**Confidence: HIGH** -- Verified via official license pages.

### 4. Dark Mode Support

Driver.js uses CSS classes (`.driver-popover`, `.driver-popover-title`, etc.) that can be overridden with standard CSS. Dark mode support is straightforward:

```css
.dark .driver-popover {
  background-color: #1e293b;
  color: #e2e8f0;
}

.dark .driver-popover-title {
  color: #f1f5f9;
}

.dark .driver-popover-description {
  color: #cbd5e1;
}

.dark .driver-popover-prev-btn,
.dark .driver-popover-next-btn {
  background-color: #3b82f6;
  color: white;
}
```

This aligns perfectly with the project's existing `@custom-variant dark (&:where(.dark, .dark *))` Tailwind v4 pattern.

**Confidence: HIGH** -- CSS class list verified from official docs.

### 5. RTL Support

Driver.js does **not** have built-in RTL support. There is an [open PR (#569)](https://github.com/kamranahmedse/driver.js/pull/569) for RTL from May 2025, but it has not been merged as of Feb 2026.

**However, this is manageable via CSS:**

```css
[dir="rtl"] .driver-popover {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .driver-popover-navigation-btns {
  flex-direction: row-reverse;
}

[dir="rtl"] .driver-popover-prev-btn {
  margin-left: 0.5rem;
  margin-right: 0;
}
```

Plus, driver.js config accepts custom button text:

```typescript
driver({
  nextBtnText: 'بعدی',
  prevBtnText: 'قبلی',
  doneBtnText: 'پایان',
  progressText: '{{current}} از {{total}}',
});
```

This is a minor pitfall (custom CSS needed) but not a blocker. No other tour library has better RTL support -- it is universally weak across the ecosystem.

**Confidence: MEDIUM** -- RTL CSS approach is standard practice; PR existence verified via GitHub.

### 6. Customization & React Integration

Driver.js provides two customization approaches:

1. **`popoverClass`** -- Add custom CSS classes to style popovers globally or per step
2. **`onPopoverRender` callback** -- Full DOM access before popover is shown. This is where React components can be rendered into popovers via `createRoot`:

```typescript
import { createRoot } from 'react-dom/client';

driver({
  steps: [...],
  onPopoverRender: (popover) => {
    const descEl = popover.description;
    const root = createRoot(descEl);
    root.render(<MyCustomStepContent />);
  },
});
```

**Title and description accept HTML strings** directly, which covers 90% of use cases without needing React rendering.

**Confidence: MEDIUM** -- `onPopoverRender` hook documented; React `createRoot` bridge is a standard pattern but not officially documented by driver.js.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Tour library | **driver.js** | react-joyride | Broken with React 19, no stable fix. Larger bundle. |
| Tour library | **driver.js** | @reactour/tour | Broken with React 19, fix not published to npm. Last npm release 2022. |
| Tour library | **driver.js** | shepherd.js | AGPL license requires commercial license. 5x larger bundle. |
| Tour library | **driver.js** | intro.js | AGPL license. Requires paid license for commercial use. |
| Tour library | **driver.js** | NextStepjs | Primarily designed for Next.js routing. Depends on Motion (framer-motion). Overkill for SPA. |
| Tour library | **driver.js** | OnboardJS | Very new library, low adoption, unproven. |
| Tour library | **driver.js** | Build from scratch with @floating-ui/react | 5-10x more work. @floating-ui/react is ~200kb unpacked. Reinventing the wheel. |
| Welcome modal | **Custom component** | Any modal library | Adding a modal library for one component is wasteful. Tailwind + React is sufficient. |

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| **react-joyride** | Incompatible with React 19.2. Stable version uses removed React DOM APIs. "next" version is unstable with no release date. Do not use. |
| **@reactour/tour** | React 19 fix merged but never published to npm. Last npm release was 2022. Effectively abandoned for npm users. |
| **shepherd.js** | AGPL-3.0 license. Requires commercial license even for internal tools at revenue-generating organizations. Also heavy (~25kb). |
| **intro.js** | AGPL license. Requires paid commercial license ($9.99+). Not worth it when driver.js is MIT and smaller. |
| **framer-motion / motion** | Sometimes suggested for animated onboarding. Massive bundle (30kb+). Overkill for coach marks. |
| **Any SaaS onboarding tool** (Appcues, UserGuiding, etc.) | This is a static site with no backend. SaaS tools require server-side integration and paid subscriptions. Not applicable. |

## Installation

```bash
# The only new dependency needed
npm install driver.js
```

That is it. Everything else uses existing project dependencies:
- **React 19** -- welcome modal component
- **Tailwind CSS v4** -- styling for modal and driver.js overrides
- **Jotai** -- persist onboarding completion state

## Architecture Overview for Integration

```
src/
  components/
    onboarding/
      WelcomeModal.tsx        -- Custom carousel modal (React + Tailwind)
      CoachMarks.tsx          -- driver.js tour definitions and launcher
      HelpButton.tsx          -- "?" floating button to relaunch tours
  hooks/
    useOnboarding.ts          -- Jotai atoms + logic for onboarding state
  styles/
    driver-overrides.css      -- Dark mode + RTL overrides for driver.js
```

## RTL + Dark Mode Compatibility Matrix

| Component | RTL Support | Dark Mode Support | Effort |
|-----------|-------------|-------------------|--------|
| driver.js popovers | Via CSS overrides (~15 lines) | Via CSS class targeting (~20 lines) | Low |
| Welcome modal | Native (built with Tailwind RTL) | Native (built with Tailwind dark:) | None (built-in) |
| Help button | Native (built with Tailwind RTL) | Native (built with Tailwind dark:) | None (built-in) |

## Version Pinning Strategy

```json
{
  "driver.js": "^1.4.0"
}
```

Use caret range. driver.js follows semver. v1.4.0 is stable (released Nov 2025). The library has been on v1.x since mid-2023 with backward-compatible updates.

## Sources

- [driver.js Official Documentation](https://driverjs.com) -- Configuration, theming, API reference
- [driver.js GitHub Repository](https://github.com/kamranahmedse/driver.js) -- 22k+ stars, MIT license, releases
- [driver.js v1.4.0 Release](https://github.com/kamranahmedse/driver.js/releases/tag/1.4.0) -- Latest release, Nov 2025
- [driver.js RTL PR #569](https://github.com/kamranahmedse/driver.js/pull/569) -- Open PR for RTL support (not merged)
- [react-joyride React 19 Issue #1122](https://github.com/gilbarbara/react-joyride/issues/1122) -- Incompatible, uses removed APIs
- [react-joyride React 19 Peer Deps Issue #1151](https://github.com/gilbarbara/react-joyride/issues/1151) -- Peer dependency conflicts
- [reactour React 19 Issue #659](https://github.com/elrumordelaluz/reactour/issues/659) -- Fixed in repo, not published to npm
- [Shepherd.js License Page](https://docs.shepherdjs.dev/guides/license/) -- AGPL-3.0, commercial license required
- [Intro.js License](https://introjs.com/docs/getting-started/license) -- AGPL, commercial license required
- [5 Best React Onboarding Libraries 2026](https://onboardjs.com/blog/5-best-react-onboarding-libraries-in-2025-compared) -- Ecosystem overview
- [npm-compare: react-joyride vs react-shepherd](https://npm-compare.com/react-joyride,react-shepherd) -- Download comparison
- [Evaluating Tour Libraries for React](https://sandroroth.com/blog/evaluating-tour-libraries/) -- Independent comparison

## Confidence Assessment

| Decision | Confidence | Basis |
|----------|------------|-------|
| driver.js as tour library | **HIGH** | React 19 compat verified via GitHub issues; MIT license verified; bundle size from official docs |
| Reject react-joyride | **HIGH** | React 19 breakage confirmed by maintainer; removed API usage verified |
| Reject @reactour/tour | **HIGH** | React 19 breakage confirmed; npm staleness verified (last publish 2022) |
| Reject shepherd.js | **HIGH** | AGPL license verified on official license page |
| Reject intro.js | **HIGH** | AGPL license verified on official docs |
| RTL via CSS overrides | **MEDIUM** | Standard CSS approach; no library has native RTL. Open PR exists but unmerged |
| Dark mode via CSS overrides | **HIGH** | CSS class names documented officially; `.dark` selector pattern matches existing project |
| Build welcome modal custom | **HIGH** | Standard React pattern; no specialized library needed for a simple carousel |
| React integration via onPopoverRender | **MEDIUM** | Hook documented officially; React createRoot bridge is standard but not documented by driver.js |
