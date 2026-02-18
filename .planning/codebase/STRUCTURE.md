# Codebase Structure

**Analysis Date:** 2026-02-18

## Directory Layout

```
barname/
├── index.html              # Entry HTML (mounts React app)
├── src/
│   ├── main.tsx            # React app initialization with Jotai Provider
│   ├── App.tsx             # Root component (layout, state orchestration)
│   ├── index.css           # Global Tailwind styles
│   ├── atoms/
│   │   └── index.ts        # Jotai atoms (schedulesAtom, currentScheduleIdAtom, slotFilterAtom)
│   ├── components/
│   │   ├── CourseSearch.tsx       # Search sidebar/bottom-sheet with filters
│   │   ├── WeeklySchedule.tsx     # FullCalendar wrapper (timeGridWeek)
│   │   ├── ScheduleTabs.tsx       # Tab UI for multiple schedules
│   │   ├── ExamsTable.tsx         # Sorted exam table with conflict highlighting
│   │   ├── ExportButtons.tsx      # JPG/JSON export, share, Google Calendar, import
│   │   ├── ManualCourseModal.tsx  # Form for adding/editing courses manually
│   │   └── TutorProfileModal.tsx  # Modal displaying tutor reviews/ratings
│   ├── data/
│   │   ├── courses.json           # Master course catalog (371 courses from EMS)
│   │   ├── tutors.json            # Tutor profile data (reviews, ratings)
│   │   ├── tutor-name-map.json    # Map of professor names to tutor IDs
│   │   └── gathered_data/         # Raw data snapshots (001.json–006.json)
│   ├── hooks/
│   │   └── useSchedule.ts         # Schedule CRUD operations (add, remove, update, import, etc.)
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces (Course, Schedule, CoursesData, etc.)
│   └── utils/
│       ├── calendar.ts            # Maps courses to FullCalendar events, color palette
│       ├── conflicts.ts           # Time + exam conflict detection algorithms
│       ├── persian.ts             # Persian digits, day names, query normalization
│       └── googleCalendar.ts      # ICS/iCal generation for Google Calendar export
├── scripts/
│   ├── fetch-courses.mjs          # Browser console scraper for EMS report #212
│   ├── merge-courses.mjs          # Merges course data from multiple sources
│   └── parse-tutor-reviews.mjs    # Parses tutor review data
├── public/
│   └── favicon.svg                # App icon
├── vite.config.ts                 # Vite build config (React + Tailwind + path alias)
├── tsconfig.json                  # TypeScript config root
├── tsconfig.app.json              # TypeScript config for src/
├── tsconfig.node.json             # TypeScript config for vite + scripts
├── eslint.config.js               # ESLint rules (React plugins, TypeScript)
├── package.json                   # Dependencies: React 19, Vite, Tailwind 4, FullCalendar 6, Jotai
└── README.md, LICENSE, CLAUDE.md
```

## Directory Purposes

**src/:**
- Purpose: All application source code
- Contains: React components, hooks, utilities, types, data files
- Key files: `App.tsx` (root), `main.tsx` (entry), `atoms/index.ts` (state), `types/index.ts` (domain model)

**src/components/:**
- Purpose: React UI components
- Contains: Presentational and container components for schedule UI
- Key files: `WeeklySchedule.tsx` (calendar), `CourseSearch.tsx` (search/filter), `ExportsButtons.tsx` (export)

**src/atoms/:**
- Purpose: Jotai atom definitions for global state
- Contains: Persisted atoms (schedules, currentScheduleId) and transient atoms (slotFilter)
- Key files: `index.ts` (only file, 18 lines)

**src/hooks/:**
- Purpose: Custom React hooks for business logic
- Contains: useSchedule hook that wraps Jotai atoms and implements schedule operations
- Key files: `useSchedule.ts` (179 lines, primary business logic)

**src/types/:**
- Purpose: TypeScript domain model
- Contains: Interfaces for Course, Schedule, CoursesData, TutorProfile, etc.
- Key files: `index.ts` (62 lines, all interfaces)

**src/utils/:**
- Purpose: Utility functions (no React)
- Contains: Conflict detection, calendar mapping, Persian text handling, iCal generation
- Key files: `conflicts.ts`, `calendar.ts`, `persian.ts`, `googleCalendar.ts`

**src/data/:**
- Purpose: Static JSON data files
- Contains: Master course catalog, tutor reviews, name mappings, raw data snapshots
- Key files: `courses.json` (371 courses), `tutors.json`, `gathered_data/` (backup snapshots)

**scripts/:**
- Purpose: Data pipeline scripts (not bundled)
- Contains: Browser console scraper and data merge tools
- Key files: `fetch-courses.mjs` (EMS scraper), `merge-courses.mjs` (combines data)

## Key File Locations

**Entry Points:**
- `index.html`: Browser loads this, mounts React to `#root`
- `src/main.tsx`: Initializes React + Jotai Provider
- `src/App.tsx`: Root component (layout, state orchestration)

**Configuration:**
- `vite.config.ts`: Vite build settings, path alias `@` → `src/`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript configuration
- `eslint.config.js`: ESLint rules for code quality
- `.prettierrc`: Code formatting (if present; not shown in this codebase)

**Core Logic:**
- `src/hooks/useSchedule.ts`: Schedule CRUD, conflict detection integration
- `src/utils/conflicts.ts`: Time and exam conflict algorithms
- `src/utils/calendar.ts`: Course-to-calendar-event mapping
- `src/atoms/index.ts`: Global state definitions

**Data Sources:**
- `src/data/courses.json`: Master course catalog (loaded at build time)
- `src/data/tutors.json`: Tutor profile data
- `src/data/tutor-name-map.json`: Professor → tutor ID mapping

**Testing:**
- No test files present in codebase (untested)

## Naming Conventions

**Files:**
- Components: PascalCase, `.tsx` extension (e.g., `CourseSearch.tsx`, `WeeklySchedule.tsx`)
- Hooks: `use` prefix, camelCase, `.ts` extension (e.g., `useSchedule.ts`)
- Utilities: camelCase, `.ts` extension (e.g., `calendar.ts`, `conflicts.ts`)
- Data: lowercase with hyphens, `.json` extension (e.g., `courses.json`, `tutor-name-map.json`)
- Type definitions: single `index.ts` per directory

**Directories:**
- UI components: `src/components/`
- Custom hooks: `src/hooks/`
- Pure functions (no React): `src/utils/`
- State atoms: `src/atoms/`
- Type definitions: `src/types/`
- Static data: `src/data/`
- Build/dev scripts: `scripts/` (root level)

**Functions:**
- Utility functions: `camelCase` starting with verb or description (e.g., `findTimeConflicts`, `toPersianDigits`)
- React components: `PascalCase` (e.g., `CourseSearch`, `WeeklySchedule`)
- Event handlers: `camelCase` with `handle` prefix (e.g., `handleSelect`, `handleEditCourse`)

**Variables:**
- State: `camelCase` (e.g., `selectedCourses`, `dark`, `showExams`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_SCHEDULES`, `COURSE_COLORS`, `BASE_SATURDAY`)
- Types: `PascalCase` (e.g., `Course`, `Schedule`, `CalendarEvent`)

**Types:**
- Interfaces: `PascalCase` (e.g., `Course`, `CourseSession`, `Schedule`)
- Enums/unions: `PascalCase` (e.g., `CourseTab = 'specialized' | 'general'`)

## Where to Add New Code

**New Feature (e.g., notifications, conflict badges):**
- Primary code: `src/components/` (new component) or existing component file
- Business logic: `src/utils/` (pure functions) if stateless, `src/hooks/` if needs state
- State: Add to `src/atoms/index.ts` if global, use React state in component if local
- Types: Add to `src/types/index.ts`
- Tests: Create `.test.ts` or `.test.tsx` file alongside component/util (currently no test framework)

**New Component/Module:**
- Implementation: `src/components/` (React) or `src/utils/` (pure functions)
- Integration: Import in `App.tsx` or parent component that needs it
- State management: If component needs global state, add atom to `src/atoms/index.ts` and expose via hook
- Styling: Use Tailwind classes inline; dark mode with `dark:` variant

**Utilities (helpers, formatters, algorithms):**
- Shared helpers: `src/utils/` with clear filename (e.g., `validation.ts`, `export.ts`)
- Import path: Use `@/utils/...` alias from any component
- No dependencies on React or Jotai; keep pure

**Styling:**
- Use Tailwind v4 utility classes directly in JSX
- Add dark mode with `dark:` prefix on every styled element
- RTL is handled by Tailwind `dir="rtl"` on html (via CSS)
- No CSS files; all styling in JSX

## Special Directories

**src/data/gathered_data/:**
- Purpose: Backup/archive of raw course data snapshots
- Generated: Manually saved from EMS scraper output
- Committed: Yes (serves as data version history)

**node_modules/:**
- Purpose: Installed dependencies
- Generated: `npm install` from package-lock.json
- Committed: No (.gitignore)

**.git/:**
- Purpose: Version control history
- Generated: `git init` and commits
- Committed: Yes

**dist/ (build output):**
- Purpose: Production bundle (created by `npm run build`)
- Generated: `vite build` command
- Committed: No (.gitignore)

## Path Aliases

- `@/` → `./src/` (configured in `vite.config.ts` and `tsconfig.app.json`)
- Always use `@/` for imports from src/ (e.g., `import { Course } from '@/types'`)

## Import Organization Pattern

Standard order observed in codebase:

1. External libraries (React, FullCalendar, Jotai)
2. Local types and interfaces (`@/types`)
3. Custom hooks (`@/hooks`)
4. Components (`@/components`)
5. Utils (`@/utils`)
6. Data/JSON files (`@/data`)
7. Atoms (`@/atoms`)

Example from `src/components/CourseSearch.tsx`:
```typescript
import { useState, useMemo } from 'react';
import { useAtom } from 'jotai';
import type { Course } from '@/types';
import { normalizeQuery, tokenizeQuery, ... } from '@/utils/persian';
import { useSchedule } from '@/hooks/useSchedule';
import { findTimeConflicts, ... } from '@/utils/conflicts';
import { TutorProfileModal } from './TutorProfileModal';
import { slotFilterAtom } from '@/atoms';
import tutorNameMap from '@/data/tutor-name-map.json';
```
