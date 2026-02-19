# Feature Landscape: Onboarding & Coach Marks

**Domain:** User onboarding for course scheduling SPA
**Researched:** 2026-02-19
**Stack:** driver.js v1.4.0 + custom welcome modal + Jotai persistence

## Table Stakes

Features users expect. Missing = onboarding feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Welcome modal on first visit** | Users need orientation to understand what the app does and how to start | Low | 3-4 slide carousel with Tailwind. Store "seen" flag in localStorage via Jotai atomWithStorage |
| **Step-by-step coach marks** | Users need to know how to search courses, add them to schedule, and view conflicts | Medium | driver.js tour highlighting CourseSearch, WeeklySchedule, ScheduleTabs, ExamsTable via data-tour attributes |
| **Skip/dismiss option** | Users who already understand the app must not be trapped. #1 complaint in product tour UX research | Low | driver.js built-in `allowClose: true` + close button. Welcome modal gets explicit "Skip" button |
| **Progress indicator** | Users need to know how many steps remain to decide whether to continue | Low | driver.js built-in `showProgress: true` + custom `progressText` template with Persian text |
| **Persistence of completion** | Users must never see onboarding again after completing it unless they request it | Low | Jotai `atomWithStorage` with versioned key (e.g., `plan-onboarding-v1`) -- consistent with existing app pattern |
| **"?" help button to relaunch** | Users who skipped or forgot must have a way back. Removes anxiety of "if I skip, I can never see this again" | Low | "?" icon in header bar, near existing dark mode toggle. Calls `launchTour()` on click |
| **Mobile-friendly** | Significant portion of university students browse on mobile | Medium | driver.js popovers reposition automatically. Welcome modal uses responsive Tailwind. Steps filtered by device |
| **RTL text in all tooltips** | All UI text is Persian. Mixed LTR/RTL breaks the experience | Low | driver.js accepts custom button text (Persian). CSS overrides for popover direction. Content passed as strings |
| **Dark mode compatibility** | App already has dark mode; onboarding must match seamlessly | Low | CSS overrides on `.dark .driver-popover` classes (see ARCHITECTURE.md) |

## Differentiators

Features that elevate onboarding from "functional" to "polished." Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Animated spotlight transitions** | Smooth transitions between highlighted elements make the tour feel premium rather than jarring | Low | driver.js built-in `animate: true` (default). Zero extra work |
| **Keyboard navigation** | Power users navigate with arrow keys, Escape to dismiss | Low | driver.js built-in `keyboardControl: true` (default). Zero extra work |
| **Device-aware step filtering** | Desktop shows sidebar search step; mobile shows FAB step. No irrelevant content | Low | Filter `steps` array by `window.matchMedia` before passing to driver.js |
| **Persian digit progress text** | Progress shows "2 از 5" not "2/5" -- maintains all-Persian UI contract | Low | `onPopoverRender` callback to replace digits with `toPersianDigits()` |
| **Contextual mini-tours per feature** | Instead of one long tour, offer focused tours (e.g., "how to export", "how to check exam conflicts") triggered from "?" menu | Medium | Multiple driver.js configurations with different step subsets. Triggered from a help menu |
| **Slide illustrations** | Welcome carousel slides with lightweight SVG/icon illustrations per feature | Medium | Writing + design task. Use abstract icons, not screenshots (screenshots break when UI changes) |
| **"What's New" tour after updates** | Show new features when app version changes | Medium | Compare stored version key to current app version. If different, re-trigger tour with new-feature-only steps |
| **Interactive "try it" step** | Tour pauses and prompts user to actually try the slot-drag filter | High | Requires pausing driver.js, detecting user action, then advancing. Only for slot-drag (the most hidden feature) |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Mandatory/unskippable tour** | #1 cause of onboarding rage-quit. University students are tech-savvy and hate being forced | Always skippable. Trust users to explore. "?" button is there when needed |
| **Long tour (6+ steps)** | Tours longer than 5 steps see dramatic drop-off (50%+ abandon after step 4). Users cannot retain sequential information | Welcome carousel (3-4 slides) + coach tour (4-5 steps) = two short sequences, not one marathon |
| **Auto-advancing slides** | Users read at different speeds. Auto-advance causes anxiety for slow readers and impatience for fast readers | Manual "Next" button only. Never auto-advance |
| **Video tutorials** | Loading overhead, bandwidth cost, cannot be skimmed, cannot be updated, does not work well in RTL | Static slides with Persian text + simple icons |
| **Full-screen takeover** | Blocks entire UI, creates sense of being trapped. Users need to see the app for context | Centered modal (max 480px) with semi-transparent backdrop. App visible around it |
| **Onboarding checklist** | Checklists make sense for complex SaaS with account setup. This is single-purpose tool with no account | The tour shows features. "?" button lets users replay. Sufficient for this complexity |
| **AI-personalized onboarding** | Massive over-engineering for a static client-side app with no user accounts and no analytics | Desktop/mobile viewport detection is the only "personalization" needed |
| **Tooltips on every element** | Coach mark abuse. Too many tooltips train users to dismiss them all | Limit to 4-5 key steps. Only highlight non-obvious features |

## Feature Dependencies

```
[Jotai persistence layer (atomWithStorage)]
    |
    +---> [Welcome carousel modal] (checks "has user completed onboarding?")
    |         |
    |         +---> [driver.js coach marks tour] (launches after "Start Tour" CTA)
    |                   |
    |                   +---> [Device-aware step filtering] (filters before tour starts)
    |
    +---> ["?" help button] (calls launchTour() to restart)

[driver-overrides.css]
    |
    +---> [Dark mode overrides] (must exist before tour looks correct)
    +---> [RTL overrides] (must exist before tour reads correctly)

[data-tour attributes on existing components]
    |
    +---> [driver.js step definitions] (selectors reference these attributes)
```

## MVP Recommendation

### Must Have (v1)

1. **Jotai atom with versioned localStorage key** -- Foundation for all state
2. **driver-overrides.css** with dark mode + RTL styles -- Must exist before any visual testing
3. **data-tour attributes** on ~7 existing elements -- Target selectors for steps
4. **Welcome carousel modal** (3-4 slides) -- First-touch orientation
5. **driver.js coach marks tour** (4-5 steps) -- Core feature tour
6. **Skip button** on modal and tour (driver.js built-in) -- Non-negotiable
7. **"?" help button** in header -- Persistent relaunch mechanism
8. **Mobile step filtering** -- Skip desktop-only steps on mobile

### Nice to Have (v1.1)

9. Persian digit progress text (via onPopoverRender)
10. Slide illustrations/icons for welcome carousel
11. Preloading driver.js during welcome modal display

### Defer (v2+)

12. Contextual mini-tours per feature
13. "What's New" versioned tours
14. Interactive "try it" step for slot-drag

## Onboarding Content Plan

### Welcome Carousel Slides

| Slide | Feature | Headline (example) | Visual | Device |
|-------|---------|---------------------|--------|--------|
| 1 | App introduction | "Build your class schedule easily" | App icon + calendar illustration | Both |
| 2 | Slot-drag filter | "Drag on empty slots to filter by time" | Calendar + drag gesture icon | Note "desktop only" on mobile |
| 3 | Multiple schedules | "Create up to 5 alternatives, compare" | Tab bar illustration | Both |
| 4 | Export & share | "Export as image or add to Google Calendar" | Share/download icon | Both |

### Coach Mark Tour Steps

| Step | Target Selector | Content | Side | Device |
|------|----------------|---------|------|--------|
| 1 | `[data-tour="course-search"]` | "Search and filter courses here" | left | Desktop |
| 1m | `[data-tour="mobile-add-btn"]` | "Tap here to search and add courses" | top | Mobile |
| 2 | `[data-tour="calendar"]` | "Your weekly schedule appears here. Drag on empty slots to filter by time (desktop)" | top | Both |
| 3 | `[data-tour="schedule-tabs"]` | "Create multiple schedule alternatives" | bottom | Both |
| 4 | `[data-tour="exams-toggle"]` | "View your exam schedule and conflicts" | bottom | Both |
| 5 | `[data-tour="export-buttons"]` | "Export as image, JSON, or Google Calendar link" | left | Both |

## Sources

- [NN/g: Onboarding Tutorials](https://www.nngroup.com/articles/onboarding-tutorials/) -- Tour length and skip behavior research
- [Appcues: Product Tour Patterns](https://www.appcues.com/blog/product-tours-ui-patterns) -- Industry patterns
- [Adobe Spectrum: Coach Mark](https://spectrum.adobe.com/page/coach-mark/) -- Design system specification
- [driver.js Configuration Docs](https://driverjs.com/docs/configuration) -- Built-in features (progress, animate, keyboard)
- [DesignerUp: 14 Types of Onboarding](https://designerup.co/blog/the-14-types-of-onboarding-ux-ui-used-by-top-apps-and-how-to-copy-them/) -- Pattern catalogue
- [Carousel UX Best Practices](https://www.eleken.co/blog-posts/carousel-ui) -- When carousels work
- Barname codebase analysis -- Target elements, existing patterns

---
*Feature research for: Barname onboarding & coach marks (driver.js approach)*
*Researched: 2026-02-19*
