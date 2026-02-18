# Architecture

**Analysis Date:** 2026-02-18

## Pattern Overview

**Overall:** Single-Page Application (SPA) with client-side state management and no backend

**Key Characteristics:**
- Static data-driven (courses loaded from `src/data/courses.json`)
- Atomic state management (Jotai) with localStorage persistence
- Component-based UI with React 18 + TypeScript
- Calendar visualization for weekly schedule (Saturday–Thursday)
- RTL-first (Persian) with dark mode support

## Layers

**Data Layer:**
- Purpose: Provides static course data and student schedule state
- Location: `src/data/` (JSON files), `src/atoms/index.ts` (state atoms), `src/types/index.ts` (type definitions)
- Contains: Course catalogs, schedule storage, filter state
- Depends on: Nothing (data is self-contained)
- Used by: All UI components and business logic

**Business Logic Layer:**
- Purpose: Implements schedule management, conflict detection, and course operations
- Location: `src/hooks/useSchedule.ts`, `src/utils/conflicts.ts`, `src/utils/calendar.ts`, `src/utils/persian.ts`
- Contains: Schedule CRUD operations, conflict algorithms, time/exam clash detection
- Depends on: Data layer (atoms, types, courses.json)
- Used by: UI components (CourseSearch, WeeklySchedule, ExamsTable, ExportButtons)

**Presentation Layer:**
- Purpose: Renders UI components for schedule interaction and visualization
- Location: `src/components/`, `src/App.tsx`
- Contains: React components for search, calendar, exams, export, modals
- Depends on: Business logic layer (hooks, utils) and data layer
- Used by: App root component

**Integration Layer:**
- Purpose: Handles external tools like calendar export and image capture
- Location: `src/utils/googleCalendar.ts` (ICS/iCal export), `src/components/ExportButtons.tsx` (html-to-image)
- Contains: Google Calendar ICS generation, JPG/PNG export via html-to-image
- Depends on: Business logic layer (selected courses)
- Used by: ExportButtons component

## Data Flow

**User Adds Course:**

1. User searches for course in `CourseSearch` component
2. Click "add" button calls `useSchedule().addCourse(course)`
3. Hook checks for duplicates and conflicts (via `findTimeConflicts`, `findExamConflicts`)
4. If valid, updates `schedulesAtom` (Jotai) to add `SelectedCourse` with mode='default'
5. localStorage persists via `atomWithStorage`
6. `WeeklySchedule` component receives updated `selectedCourses` and re-renders calendar
7. `ExamsTable` component also re-renders to show exam schedule

**User Exports Schedule:**

1. ExportButtons reads `selectedCourses` from `useSchedule()` hook
2. For JPG: uses `html-to-image.toJpeg()` to capture `#schedule-export-area` DOM
3. For JSON: filters courses (excludes hover mode) and stringifies `{ courses: [...] }`
4. For Google Calendar: calls `downloadICS()` to generate `.ics` file
5. Browser downloads file or shares via Web Share API

**User Filters by Time Slot:**

1. User clicks calendar time slot → `handleSelect(info: DateSelectArg)` fires
2. Sets `slotFilterAtom` with dayOfWeek, startTime, endTime
3. `CourseSearch` component reads atom and filters course list accordingly
4. `useEffect` clears FullCalendar selection highlight to avoid visual overlap

**State Management:**

- `schedulesAtom`: Array of Schedule objects (id, courses[]), persisted to `plan-schedules`
- `currentScheduleIdAtom`: Active schedule ID (0–4), persisted to `plan-currentScheduleId`
- `slotFilterAtom`: Optional SlotFilter state for time-based filtering (transient, not persisted)
- Jotai `atomWithStorage` handles localStorage serialization/deserialization

## Key Abstractions

**Schedule:**
- Purpose: Groups courses into distinct schedules (up to 5 per user)
- Examples: `src/types/index.ts` (interface), `src/hooks/useSchedule.ts` (CRUD)
- Pattern: Immutable updates via atom setters; new arrays created on each change

**Course & SelectedCourse:**
- Purpose: Core domain model representing a course; SelectedCourse adds hover mode tracking
- Examples: `src/types/index.ts`
- Pattern: SelectedCourse = Course + mode: 'default' | 'hover' | 'both'

**Conflict Detection:**
- Purpose: Identifies time and exam clashes across selected courses
- Examples: `src/utils/conflicts.ts` (hasTimeConflict, findTimeConflicts, findExamConflicts)
- Pattern: Pure functions that ignore same-course groups (same courseCode doesn't conflict with itself)

**Calendar Event Mapping:**
- Purpose: Transforms SelectedCourse objects into FullCalendar events
- Examples: `src/utils/calendar.ts` (coursesToEvents)
- Pattern: Maps course sessions to calendar events with color cycling; detects conflict flags per session

**Persian Utilities:**
- Purpose: Handles Persian/Farsi text normalization, digit conversion, day naming
- Examples: `src/utils/persian.ts` (toPersianDigits, normalizeQuery, dayName, WEEK_DAYS)
- Pattern: Query normalization for search (converts Arabic/Persian digits/letters to normalized form)

## Entry Points

**Application Root:**
- Location: `src/main.tsx`
- Triggers: Browser loads index.html
- Responsibilities: Mounts React app into DOM with Jotai Provider

**App Component:**
- Location: `src/App.tsx`
- Triggers: Mounted by main.tsx
- Responsibilities: Orchestrates layout (header, sidebar, main content, mobile sheet); manages global state (dark mode, hover course, modal state); renders header, tabs, search, calendar, exams

**Main Content:**
- WeeklySchedule: `src/components/WeeklySchedule.tsx` — renders FullCalendar with schedule grid
- CourseSearch: `src/components/CourseSearch.tsx` — sidebar/bottom-sheet for course selection and filtering
- ExamsTable: `src/components/ExamsTable.tsx` — table view of exam schedule with conflict highlighting
- ScheduleTabs: `src/components/ScheduleTabs.tsx` — multi-schedule tab UI
- ExportButtons: `src/components/ExportButtons.tsx` — export/import/share buttons

## Error Handling

**Strategy:** Silent failures with user alerts

**Patterns:**
- Image export failures (html-to-image): logs error to console, shows Persian alert "خطا در ذخیره تصویر"
- localStorage access: wrapped in try-catch; defaults to sessionStorage or in-memory state if unavailable
- File parsing (import): validates JSON structure, shows alert on malformed input
- FullCalendar initialization: handles missing or invalid date ranges gracefully

## Cross-Cutting Concerns

**Logging:** Uses browser console.error() for critical failures (export errors); no structured logging framework

**Validation:**
- Course deduplication: checks courseCode + group pair to prevent duplicates
- Conflict detection: validates across all selected courses before adding
- Import validation: ensures courses exist in master catalog before importing

**Authentication:** Not applicable; app is fully client-side

**Persistence:**
- Jotai `atomWithStorage` handles all localStorage serialization
- Fallback to in-memory state if localStorage is unavailable (private browsing)
- Dark mode and mobile banner dismissal tracked separately via direct localStorage access
