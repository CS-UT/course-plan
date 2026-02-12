# CLAUDE.md

## Project Overview

Course scheduling app for University of Tehran, Faculty of Mathematics, Statistics & Computer Science. Hosted at plan.csut.ir. Similar to barnomz.ir (Sharif University equivalent).

Static client-side app — no backend. Course data is a static JSON file scraped from the university's EMS system.

## Tech Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS v4** with RTL support, `@custom-variant dark` for dark mode
- **Jotai** with `atomWithStorage` for localStorage-persisted state
- **FullCalendar** `timeGridWeek` for weekly schedule grid (Saturday–Thursday)
- **html2canvas** for JPG export
- **Vazirmatn** Google Font for Persian text

## Commands

- `npm run dev` — start dev server
- `npm run build` — typecheck + production build (`tsc -b && vite build`)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — typecheck only

## Project Structure

```
src/
  App.tsx              — main layout, dark mode toggle, mobile banner
  atoms/index.ts       — Jotai atoms (schedules, currentScheduleId)
  components/
    CourseSearch.tsx    — search sidebar with text search + filter panel
    WeeklySchedule.tsx — FullCalendar wrapper (Sat–Thu, RTL)
    ScheduleTabs.tsx   — tab UI for multiple schedules (max 5)
    ExamsTable.tsx     — sorted exam table with conflict highlighting
    ExportButtons.tsx  — JPG download + Web Share API
  data/courses.json    — 371 real courses from EMS report #212
  hooks/useSchedule.ts — schedule CRUD operations
  types/index.ts       — Course, CourseSession, Schedule, etc.
  utils/
    calendar.ts        — maps courses to FullCalendar events, color palette
    conflicts.ts       — time + exam conflict detection
    persian.ts         — Persian digits, day names, query normalization
scripts/
  fetch-courses.mjs    — browser console scraper for EMS report #212
```

## Key Architecture Details

### FullCalendar Week Mapping
- Base date: 2023-12-30 (a Saturday) used as anchor
- `firstDay={6}` for Saturday start, `hiddenDays={[5]}` to hide Friday
- Day-of-week mapping: 6=شنبه, 0=یکشنبه, 1=دوشنبه, 2=سه‌شنبه, 3=چهارشنبه, 4=پنجشنبه

### Conflict Detection
- `findTimeConflicts` / `findExamConflicts` in `utils/conflicts.ts`
- Skips comparison between groups of the same course (same `courseCode`)

### Data Pipeline
- `scripts/fetch-courses.mjs` is a browser console script for scraping EMS report #212
- User must be logged into ems2.ut.ac.ir, then paste script in DevTools console
- Uses Knockout.js ViewModel (`ko.contextFor`) for NpGrid pagination (`vm.currpage()`, `vm.pagecount()`)
- Downloads JSON to replace `src/data/courses.json`

### Dark Mode
- Class-based toggle with `@custom-variant dark (&:where(.dark, .dark *))` in Tailwind v4
- Persisted to localStorage, respects system preference as default

## Style Guidelines

- All UI text is Persian (RTL)
- Use `toPersianDigits()` for any numbers shown to the user
- Dark mode classes (`dark:`) must be added to every styled element
- Keep components in `src/components/`, one component per file
