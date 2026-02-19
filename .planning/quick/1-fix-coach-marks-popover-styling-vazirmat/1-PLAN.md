---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/onboarding/driver-overrides.css
autonomous: true
must_haves:
  truths:
    - "Tour popover renders all text in Vazirmatn font (title, description, buttons, progress)"
    - "Tour popover has rounded corners consistent with app card styling (0.75rem)"
    - "Tour popover text is well-styled with proper line-height and sizing for Persian readability"
  artifacts:
    - path: "src/components/onboarding/driver-overrides.css"
      provides: "Complete driver.js popover style overrides"
      contains: "driver-popover"
  key_links:
    - from: "src/components/onboarding/driver-overrides.css"
      to: "driver.js/dist/driver.css"
      via: "CSS specificity override (unlayered import)"
      pattern: "driver-popover"
---

<objective>
Fix driver.js coach marks popover styling so it uses the Vazirmatn font throughout, has better text styling for Persian readability, and uses rounded corners consistent with the rest of the app UI.

Purpose: The driver.js default CSS applies `font-family` via `.driver-popover *` selector and uses `font:` shorthand on title/description which resets font-family. The current override only targets `.driver-popover` parent, so Vazirmatn never actually renders. Additionally, the default 5px border-radius looks inconsistent with the app's 0.75rem card radius.

Output: Updated driver-overrides.css with complete font, text, and border-radius fixes.
</objective>

<execution_context>
@/home/erfan/.claude/get-shit-done/workflows/execute-plan.md
@/home/erfan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/onboarding/driver-overrides.css
@src/index.css
@node_modules/driver.js/dist/driver.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Vazirmatn font, text styling, and rounded corners in driver-overrides.css</name>
  <files>src/components/onboarding/driver-overrides.css</files>
  <action>
Update the driver-overrides.css to fix three issues:

**1. Font override (critical fix):**
The driver.js base CSS applies `font-family` via `.driver-popover *` (star selector) which has higher specificity than the current `.driver-popover` override. Additionally, `.driver-popover-title` and `.driver-popover-description` use `font:` shorthand (`font: 19px/normal sans-serif` and `font: 14px/normal sans-serif`) which resets font-family entirely.

Fix by adding:
```css
.driver-popover,
.driver-popover * {
  font-family: "Vazirmatn", system-ui, sans-serif;
}
```
This replaces the existing `.driver-popover { font-family: ... }` rule.

**2. Text styling for Persian readability:**
Override the driver.js default title and description font shorthand with explicit properties for better Persian text rendering:

- `.driver-popover-title`: set `font-size: 1rem` (16px, slightly smaller than default 19px for better balance with Persian script), `font-weight: 700`, `line-height: 1.7` (Persian needs more line-height than Latin)
- `.driver-popover-description`: set `font-size: 0.875rem` (14px), `font-weight: 400`, `line-height: 1.8` (generous for multi-line Persian)
- `.driver-popover-progress-text`: set `font-size: 0.8rem`
- `.driver-popover-footer button`: set `font-size: 0.8rem`, `padding: 5px 12px`, `border-radius: 0.375rem` (6px, matching app's small button radius)
- `.driver-popover-navigation-btns .driver-popover-next-btn` (light mode): set `background-color: #3b82f6`, `color: #ffffff`, `border-color: #3b82f6` to match the primary brand blue (currently only styled for dark mode)

**3. Rounded corners:**
Add `border-radius: 0.75rem` (12px) to `.driver-popover` to match the app's card radius used in `.fc .fc-scrollgrid` and `.transposed-cal > div`.

Keep all existing dark mode, RTL, and mobile viewport safety overrides intact. The dark mode `.driver-popover-navigation-btns .driver-popover-next-btn` already has the blue styling -- just ensure the light mode now matches.
  </action>
  <verify>
Run `npm run build` to confirm no build errors. Then visually inspect by running `npm run dev`, opening the app in browser, and triggering the tour -- all popover text should render in Vazirmatn with rounded corners.
  </verify>
  <done>
Tour popovers render with Vazirmatn font on all text elements (title, description, buttons, progress). Popover has 0.75rem rounded corners. Title and description have appropriate Persian-friendly line-heights. Next button is styled with primary blue in both light and dark modes.
  </done>
</task>

</tasks>

<verification>
- `npm run build` passes with no errors
- Tour popover visually renders Vazirmatn font (not Helvetica/sans-serif)
- Popover corners are visibly more rounded than default (12px vs 5px)
- Persian text has comfortable line-height and spacing
- Dark mode popover styling remains correct
- RTL layout remains correct
- Mobile viewport safety (max-width calc) remains intact
</verification>

<success_criteria>
All driver.js tour popover text renders in Vazirmatn. Popover border-radius matches app card styling (0.75rem). Text sizing and line-height are tuned for Persian readability. Both light and dark mode look consistent.
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-coach-marks-popover-styling-vazirmat/1-SUMMARY.md`
</output>
