# Coding Conventions

**Analysis Date:** 2026-02-18

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `CourseSearch.tsx`, `WeeklySchedule.tsx`, `ManualCourseModal.tsx`)
- Utility/helper modules: camelCase with `.ts` extension (e.g., `conflicts.ts`, `calendar.ts`, `persian.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useSchedule.ts`)
- Data/JSON files: kebab-case (e.g., `tutor-name-map.json`, `courses.json`)
- Atom/store files: `index.ts` in `atoms/` directory

**Functions:**
- All functions use camelCase (e.g., `findTimeConflicts`, `coursesToEvents`, `toPersianDigits`)
- React components are PascalCase (e.g., `CourseSearch`, `WeeklySchedule`, `ExportButtons`)
- Helper functions prefix with clear verb: `find*`, `get*`, `has*`, `to*`, `normalize*`, `tokenize*`, `matches*`
- Event handlers prefixed with `handle` (e.g., `handleSelect`, `handleImport`, `handleEditCourse`)

**Variables:**
- Local state: camelCase (e.g., `hoveredCourse`, `selectedCourses`, `currentScheduleId`)
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `BASE_SATURDAY`, `COURSE_COLORS`, `MAX_SCHEDULES`, `WEEK_DAYS`)
- Component props interfaces: `Props`
- Boolean variables: `is*` or `has*` or `show*` prefix (e.g., `isEditing`, `hasTimeConflict`, `showExams`)

**Types:**
- Interfaces: PascalCase with clear domain (e.g., `Course`, `CourseSession`, `Schedule`, `SelectedCourse`, `TutorProfile`, `CalendarEvent`)
- Type unions: camelCase prefixed with `type` keyword (e.g., `type CourseTab = 'specialized' | 'general'`)
- Atom types: camelCase with `Atom` suffix in export (e.g., `schedulesAtom`, `currentScheduleIdAtom`, `slotFilterAtom`)
- Discriminated types: Use explicit string literals (e.g., `mode?: 'default' | 'hover' | 'both'`)

## Code Style

**Formatting:**
- No explicit formatter configured (no `.prettierrc`)
- Consistent 2-space indentation throughout codebase
- Single quotes for strings (TypeScript convention)
- Semicolons required
- Arrow functions preferred for callbacks and short functions
- JSX: Elements on single line if short, multiline with clear structure otherwise

**Linting:**
- ESLint with TypeScript support (`typescript-eslint`)
- Config: `eslint.config.js` using flat config (ESLint 9.x)
- Extends: `@eslint/js`, `typescript-eslint/configs/recommended`, `react-hooks/recommended`, `react-refresh/vite`
- Enforced rules include React hooks best practices and React refresh

**TypeScript:**
- Target: ES2022
- Strict mode enabled: `"strict": true`
- `noUnusedLocals` and `noUnusedParameters` enforced
- `noFallthroughCasesInSwitch` enabled
- JSON modules enabled with `resolveJsonModule`
- Path aliases: `@/*` maps to `./src/*` for absolute imports

## Import Organization

**Order:**
1. React and React hooks (from `'react'`)
2. Third-party dependencies (@fullcalendar, jotai, moment-jalaali, html-to-image, etc.)
3. Type imports (prefixed with `type` keyword)
4. Local absolute imports (@/types, @/utils, @/hooks, @/atoms, @/components)
5. Relative component imports (./ComponentName)
6. Data imports (@/data)

**Example from `CourseSearch.tsx`:**
```typescript
import { useState, useMemo } from 'react';
import { useAtom } from 'jotai';
import type { Course } from '@/types';
import { normalizeQuery, tokenizeQuery, matchesAllTokens, toPersianDigits, dayName, WEEK_DAYS_ORDER } from '@/utils/persian';
import { useSchedule } from '@/hooks/useSchedule';
import { findTimeConflicts, findExamConflicts } from '@/utils/conflicts';
import { TutorProfileModal } from './TutorProfileModal';
import { slotFilterAtom } from '@/atoms';
import tutorNameMap from '@/data/tutor-name-map.json';
```

**Path Aliases:**
- Use `@/` prefix for all absolute imports from src directory
- Never use relative paths like `../../../utils` - always use `@/utils`
- Type imports use `type` keyword explicitly: `import type { Course } from '@/types'`

## Error Handling

**Strategy:** Silent failure with user feedback for UI operations, exceptions preserved for dev debugging.

**Patterns:**

1. **localStorage/sessionStorage access:** Wrapped in try-catch with fallback to defaults
   ```typescript
   try {
     return localStorage.getItem('plan-dark-mode') === 'true';
   } catch {
     return false; // private browsing or storage disabled
   }
   ```

2. **Async operations:** Try-catch with console.error for debugging
   ```typescript
   try {
     const dataUrl = await toJpeg(el, { /* options */ });
     // ...
   } catch (err) {
     console.error('Failed to capture schedule:', err);
     alert('خطا در ذخیره تصویر. لطفا دوباره تلاش کنید.');
   }
   ```

3. **Data validation in imports:** Check types before using
   ```typescript
   if (typeof entry.courseCode !== 'string' || typeof entry.group !== 'number') {
     alert('فرمت فایل نامعتبر است.');
     return;
   }
   ```

4. **Graceful fallbacks:** Multiple strategies for Web APIs
   - Try primary method → fallback → final fallback (see `ExportButtons.tsx` shareImage: Web Share API → clipboard → download)
   - Silent failures with user-facing notification

5. **Component error states:** Render error messages in UI
   - Use `error` state variable for form validation errors
   - Display in red text: `text-danger-600 dark:text-danger-400`

## Logging

**Framework:** `console` (native browser console only)

**Patterns:**
- Use `console.error()` only for unexpected runtime failures (not control flow)
- No logging for normal operations
- Error messages include context (e.g., 'Failed to capture schedule:')
- Debugging: leverage browser DevTools and React DevTools

**Examples:**
- `src/components/ExportButtons.tsx`: `console.error('Failed to capture schedule:', err);`
- No info/debug/warn logging in application code

## Comments

**When to Comment:**
- Explain non-obvious algorithm logic (e.g., `src/utils/calendar.ts` day-of-week mapping comments)
- Clarify Persian-specific logic (digit conversion, day names, Jalali calendar)
- Document workarounds and browser compatibility concerns
- Explain why, not what (code should be self-documenting)

**JSDoc/TSDoc:**
- Not used throughout codebase - type system is primary documentation
- Inline comments preferred over block comments
- No @param/@returns decorators observed

**Example from `src/utils/calendar.ts`:**
```typescript
// FullCalendar uses a base date for timeGridWeek. We use a fixed Saturday.
// 2023-12-30 is a Saturday (شنبه)
const BASE_SATURDAY = '2023-12-30';

function dayOffsetFromSaturday(dayOfWeek: number): number {
  // dayOfWeek: 6=شنبه(Saturday), 0=یکشنبه(Sunday), 1=دوشنبه(Monday),...
  // We need offset from Saturday
  if (dayOfWeek === 6) return 0;
  return dayOfWeek + 1; // 0->1, 1->2, 2->3, 3->4, 4->5
}
```

## Function Design

**Size:** Most functions 10-30 lines; complex functions (like `CourseSearch` filtering) up to 80+ lines with clear sections

**Parameters:**
- Pass destructured objects for multiple related params (e.g., `Props` interface)
- Use function signatures within component definitions for tightly-coupled helpers
- Avoid boolean parameter flags when possible - use enums or discriminated types

**Return Values:**
- Return `null` to signal "no data" (e.g., `hoveredCourse: Course | null`)
- Return objects with multiple related values (e.g., `{ timeConflicts: Course[]; examConflicts: Course[] } | null`)
- Use explicit types on function signatures for clarity

**Example from `src/hooks/useSchedule.ts`:**
```typescript
function addCourse(course: Course): { timeConflicts: Course[]; examConflicts: Course[] } | null {
  const exists = selectedCourses.some(
    (c) => c.courseCode === course.courseCode && c.group === course.group,
  );
  if (exists) return null;

  const timeConflicts = findTimeConflicts(course, selectedCourses);
  const examConflicts = findExamConflicts(course, selectedCourses);

  // ... mutation logic ...

  if (timeConflicts.length > 0 || examConflicts.length > 0) {
    return { timeConflicts, examConflicts };
  }
  return null;
}
```

## Module Design

**Exports:**
- Use `export function Name()` for public functions and components
- Use `export interface Name` for types meant to be consumed
- Use `export const` for constants and atoms
- Named exports preferred; default exports used only for main App component

**Barrel Files:**
- `src/atoms/index.ts` - exports all atom definitions
- `src/types/index.ts` - exports all type definitions
- No component barrel files - import components directly

**File Organization:**
- One component per file in `src/components/`
- One hook per file in `src/hooks/`
- Utility functions grouped by domain in `src/utils/` (e.g., `conflicts.ts`, `calendar.ts`, `persian.ts`)
- Related interfaces and types exported from `src/types/index.ts`

---

*Convention analysis: 2026-02-18*
