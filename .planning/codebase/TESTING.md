# Testing Patterns

**Analysis Date:** 2026-02-18

## Test Framework

**Status:** Not detected

No test framework is configured or in use. No test files exist in `src/` directory (`vitest`, `jest`, or other testing frameworks not in devDependencies).

**Package Managers:**
- `package.json` contains no testing framework dependencies
- No `vitest.config.ts`, `jest.config.js`, or similar test configuration files present
- No `@testing-library`, `vitest`, `jest`, or `chai` packages installed

## Test File Organization

**Not Applicable** - Testing infrastructure not established.

Current structure if testing were to be added:
- **Recommended Location:** Co-located with source files (e.g., `src/utils/conflicts.test.ts` alongside `src/utils/conflicts.ts`)
- **Naming Convention:** `*.test.ts` or `*.spec.ts` suffix
- **Test Organization:** One test file per source file, matching the module structure

## Test Structure

No existing test patterns to document. Recommended structure if testing is implemented:

```typescript
describe('Module Name', () => {
  describe('functionName', () => {
    it('should do X given input Y', () => {
      // Arrange
      const input = /* setup */;

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

## Mocking

**Not in use** - No test infrastructure present.

If mocking were implemented:
- Mock external libraries like `jotai` for atom state management
- Mock localStorage/sessionStorage for persistence tests
- Mock FullCalendar API interactions
- Mock file I/O for import/export operations

## Fixtures and Factories

**Not in use** - No test data infrastructure.

If fixtures were implemented, location: `src/__fixtures__/` or `src/__mocks__/`

Potential test data needs:
- Sample `Course` objects with various conflict scenarios
- Jalali date strings for exam date conflicts
- Course session time combinations
- Valid and invalid JSON import payloads

## Coverage

**Not enforced** - No coverage tooling configured.

Critical areas that should have test coverage if framework were added:
1. **Conflict detection** (`src/utils/conflicts.ts`) - Core business logic
   - Time conflict detection across different day/time combinations
   - Exam conflict detection with duplicate exam times
   - Edge cases: same course code/group should not conflict

2. **Persian utilities** (`src/utils/persian.ts`) - Text processing
   - Digit conversion (Persian ↔ English)
   - Query normalization (Arabic → Persian letters, ZWNJ handling)
   - Tokenization and matching logic

3. **Calendar mapping** (`src/utils/calendar.ts`) - Data transformation
   - Course sessions → FullCalendar events
   - Color assignment consistency
   - Date offset calculations for day-of-week

4. **Schedule operations** (`src/hooks/useSchedule.ts`) - State management
   - Course add/remove/update operations
   - Duplicate prevention
   - Schedule CRUD (create, duplicate, delete)
   - Import/export logic

5. **Component behavior** - UI interaction (requires React Testing Library)
   - Course selection/deselection
   - Filter application and clearing
   - Modal open/close states
   - Export functionality

## Test Types

**Unit Tests** (if implemented):
- Scope: Individual utility functions in `src/utils/`
- Approach: Pure function testing (conflicts.ts, persian.ts, calendar.ts)
- No external dependencies required
- Example: test `findTimeConflict()` with various session combinations

**Integration Tests** (if implemented):
- Scope: Hook interactions with atoms (`src/hooks/useSchedule.ts`)
- Approach: Test state mutations through hook APIs
- Mock Jotai atoms
- Example: test `addCourse()` -> `removeCourse()` -> verify state

**Component Tests** (if implemented):
- Framework: Would require React Testing Library
- Scope: Component user interactions
- Example: CourseSearch filtering, ScheduleTabs switching, modal open/close
- Not currently implemented; would require new dependency

**E2E Tests** (if implemented):
- Framework: Not specified; Cypress or Playwright would be candidates
- Scope: Full user workflows (search → add course → export schedule)
- Not currently in scope

## Common Patterns

Not applicable - no test framework integrated.

If Vitest were adopted (recommended for Vite project):
```typescript
import { describe, it, expect } from 'vitest';
import { findTimeConflicts } from '@/utils/conflicts';
import type { Course } from '@/types';

describe('conflicts', () => {
  it('detects time conflict between two sessions', () => {
    const course1: Course = {
      courseCode: '6105001',
      group: 1,
      sessions: [{ dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }],
      // ... other required fields
    };

    const course2: Course = {
      courseCode: '6105002',
      group: 1,
      sessions: [{ dayOfWeek: 1, startTime: '09:00', endTime: '11:00' }],
      // ... other required fields
    };

    const conflicts = findTimeConflicts(course1, [course2]);
    expect(conflicts).toContain(course2);
  });
});
```

## Async Testing

If testing framework were added, async patterns would follow:
```typescript
it('should import valid JSON courses', async () => {
  const result = await importCourses(validJSON);
  expect(result.added).toBe(2);
});
```

## Error Testing

Error cases should be tested for:
1. **Invalid JSON imports** - test with malformed JSON
2. **localStorage unavailable** - test try-catch fallbacks in App.tsx
3. **File reading failures** - test error boundary for import handler
4. **Conflict detection edge cases** - test with edge times (23:59, 00:00)

---

## Recommendations for Implementation

1. **Add Vitest** - Native Vite integration, TypeScript support, fast
2. **Add React Testing Library** - For component testing
3. **Start with utility tests** - `conflicts.ts`, `persian.ts` have clear specs
4. **Test high-risk areas first:**
   - Conflict detection (core logic)
   - Import/export (data integrity)
   - State mutations in useSchedule hook
5. **Aim for 70%+ coverage** - Focus on critical paths
6. **Add pre-commit hook** - Prevent commits that break tests

---

*Testing analysis: 2026-02-18*
