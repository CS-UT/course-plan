# Codebase Concerns

**Analysis Date:** 2025-02-18

## Tech Debt

**WeeklySchedule Component Size:**
- Issue: `src/components/WeeklySchedule.tsx` is 681 lines with complex nested logic for both FullCalendar and transposed calendar views, including tooltip management, event handling, and layout calculation
- Files: `src/components/WeeklySchedule.tsx`
- Impact: Difficult to maintain, test, and modify without breaking existing features. Adding new features requires understanding extensive DOM ref handling and complex rendering logic
- Fix approach: Split into smaller components (e.g., `TransposedCalendar.tsx`, `TooltipManager.tsx`, `EventHandler.tsx`). Extract tooltip positioning logic into a custom hook

**Conflict Detection Algorithm Inefficiency:**
- Issue: `findTimeConflicts()` in `src/utils/conflicts.ts` and the conflict calculation in `src/utils/calendar.ts` use nested loops that check every pair of sessions. In `coursesToEvents()`, this O(n²m²) operation happens on every render during session conflict pre-computation
- Files: `src/utils/calendar.ts` (lines 60-77), `src/utils/conflicts.ts` (lines 13-31)
- Impact: Performance degrades noticeably with large schedules. Re-rendering after adding courses can be laggy
- Fix approach: Memoize conflict results by course code. Pre-compute conflict matrix once per schedule change rather than on every calendar render. Use a map-based lookup instead of nested iteration

**Static Color Map Shared Across Instances:**
- Issue: `colorMap` in `src/components/WeeklySchedule.tsx` (line 26) and `transposedColorMap` (line 531) are module-level static maps that persist across component instances
- Files: `src/components/WeeklySchedule.tsx`
- Impact: If multiple WeeklySchedule components are rendered simultaneously (unlikely but possible), they share color assignments, leading to unpredictable colors. Creates hidden state coupling
- Fix approach: Move color maps to component state or pass as props. Consider using a color hash function instead of stateful maps

**Magic Numbers Throughout Calendar Logic:**
- Issue: Base date `2023-12-30` (hardcoded in `src/utils/calendar.ts`), hour offsets (SLOT_START=7, SLOT_END=20 in `src/components/WeeklySchedule.tsx`), and semester dates in `src/utils/googleCalendar.ts` are scattered
- Files: `src/utils/calendar.ts` (line 22), `src/components/WeeklySchedule.tsx` (lines 403-404), `src/utils/googleCalendar.ts` (lines 6-7)
- Impact: Hard-coded semester end dates become stale. Changing time slot ranges requires finding all magic numbers. Calendar month/year logic is fragile
- Fix approach: Create a `src/config/calendar.ts` with all constants. Add a semester configuration object that includes start/end dates

**Manual Course Code Generation:**
- Issue: `courseCode` generation uses timestamp + random string: `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` in `src/components/ManualCourseModal.tsx` (line 147)
- Files: `src/components/ManualCourseModal.tsx` (line 147)
- Impact: Collision risk is low but non-zero. UUID would be safer. Timestamp-based IDs are not stable across exports/imports if generated multiple times
- Fix approach: Use `crypto.randomUUID()` or a proper UUID library. Document that manual courses use synthetic IDs

**Department Detection Heuristics:**
- Issue: `getDepartment()` in `src/components/CourseSearch.tsx` (lines 43-52) uses brittle string matching on the `notes` field to extract department from general courses
- Files: `src/components/CourseSearch.tsx` (lines 43-52)
- Impact: If data format changes or new general courses use different naming, filtering breaks silently. No error reporting for unmatched patterns
- Fix approach: Add a `department` field to the Course type. Parse department from data pipeline, not UI layer. Add logging for unmatched patterns during import

---

## Performance Bottlenecks

**Calendar Event Generation on Every Hover:**
- Problem: `coursesToEvents()` is called on every `allCourses` change, including when a course is hovered. With conflict pre-computation, this runs O(n²m²) work even for preview hovers
- Files: `src/components/WeeklySchedule.tsx` (lines 126-129)
- Cause: `hoveredCourse` updates cause re-memos, even though conflicts shouldn't change during preview
- Improvement path: Separate conflict computation from event generation. Memoize conflict matrix separately. Use shallow equality checks for `hoveredCourse` to skip re-computation

**Image Export Performance:**
- Problem: `html-to-image` with `pixelRatio: 2` in `src/components/ExportButtons.tsx` can take 2-5 seconds for large schedules, blocking the UI
- Files: `src/components/ExportButtons.tsx` (lines 32-36, 62, 77-94)
- Cause: Rendering full DOM with high pixel ratio in single-threaded JavaScript
- Improvement path: Add progress indicator. Use Web Worker for image generation. Reduce default pixelRatio to 1 on initial export, 2 on demand

**Slot Filter Search Recomputation:**
- Problem: `filtered` useMemo in `src/components/CourseSearch.tsx` (lines 85-131) re-computes on every `slotFilter` change even if only time changed slightly
- Files: `src/components/CourseSearch.tsx` (lines 85-131)
- Cause: No debouncing or range-based optimization for time filters
- Improvement path: Memoize filtered results by filter state. Pre-index sessions by day/time range. Use interval trees for fast time overlap queries

---

## Fragile Areas

**Date/Time Handling Across Multiple Formats:**
- Files: `src/utils/calendar.ts`, `src/utils/googleCalendar.ts`, `src/components/ManualCourseModal.tsx`
- Why fragile: Code mixes JavaScript dates (year 2023-2024), Jalali date strings ("1405/04/20"), and time strings ("HH:mm"). Converting between them happens in multiple places with no centralized parser
- Safe modification: Create a `src/utils/dateTime.ts` with normalized conversion functions. Never parse dates inline. Test all date transitions (month boundaries, year boundaries)
- Test coverage: No unit tests for date/time conversions. Edge cases like Jalali month 13 not tested

**Jotai Atom Management:**
- Files: `src/atoms/index.ts` (schedulesAtom, currentScheduleIdAtom), referenced in `src/components/CourseSearch.tsx`, `src/hooks/useSchedule.ts`, `src/components/WeeklySchedule.tsx`
- Why fragile: Atoms use `atomWithStorage` but have no validation on deserialization. If localStorage contains corrupted JSON or old schema, the app silently loads invalid state
- Safe modification: Add a migration function in atoms that validates and upgrades old storage formats. Test with corrupted/missing localStorage
- Test coverage: No tests for storage deserialization or schema changes

**Course Search Filtering Logic:**
- Files: `src/components/CourseSearch.tsx` (lines 85-131)
- Why fragile: Multiple independent filters (`day`, `gender`, `department`, `courseCode`, `hideConflicts`, `slotFilter`) are applied sequentially with no clear precedence or interaction rules
- Safe modification: Define filter interaction matrix. Add unit tests for filter combinations (especially `hideConflicts` + `slotFilter`). Document why `department` filter resets on tab change
- Test coverage: No tests for filter combinations or edge cases like "conflicting courses that match slot filter"

**Time Conflict Logic:**
- Files: `src/utils/conflicts.ts` (lines 3-5)
- Why fragile: Time overlap check `a.startTime < b.endTime && b.startTime < a.endTime` assumes times are always in HH:mm format and comparable as strings. Will break if times include seconds or use 12-hour format
- Safe modification: Use proper time parsing with type safety. Add runtime validation on import. Test with edge times (00:00, 23:59, boundary crossings)
- Test coverage: No tests for time parsing or edge cases

**Calendar Event ID Generation:**
- Files: `src/utils/calendar.ts` (line 100)
- Why fragile: Event ID is `${course.courseCode}-${course.group}-${i}` where `i` is session index. If session order changes during course updates, IDs become unstable and FullCalendar may not re-render correctly
- Safe modification: Use stable session identifiers instead of array index. Consider hashing session content
- Test coverage: No tests for multi-session course event stability

---

## Data Structure Issues

**Exam Event Duplication in ICS:**
- Files: `src/utils/googleCalendar.ts` (lines 98-119)
- Risk: Exam event only created if `i === 0` (first session only), but multiple sessions could reference the same exam. Creates inconsistency between web UI and calendar export
- Current mitigation: Comment on line 98 documents intent, but no validation that all sessions point to same exam
- Recommendations: Add `examId` to Course type to uniquely identify which sessions share an exam. Export exam for each session that references it, de-duplicating in ICS

**Missing Validation on Import:**
- Files: `src/components/ExportButtons.tsx` (lines 145-174)
- Risk: JSON import validates structure (`data.courses` array, each entry has `courseCode` and `group`) but doesn't validate that courses exist in current semester or that sessions are valid
- Current mitigation: "not found" list is shown to user but silently skipped
- Recommendations: Add warnings for major data inconsistencies (e.g., course code format mismatch, invalid group numbers). Log skipped courses for debugging

**No Schema Validation:**
- Files: All data loading in `src/App.tsx`, `src/components/ExportButtons.tsx`, `src/components/CourseSearch.tsx`
- Risk: If `courses.json` is corrupted or updated with different schema, parsing fails silently or with cryptic errors
- Current mitigation: TypeScript types provide some compile-time safety, but runtime parsing is unprotected
- Recommendations: Add `zod` or `yup` schema validation. Validate courses.json on app load with clear error messages

---

## Exam Date Handling

**Hardcoded Semester Dates:**
- Files: `src/utils/googleCalendar.ts` (lines 6-7)
- Problem: Semester start/end dates (`SEMESTER_START_JALALI`, `SEMESTER_END_JALALI`) are hardcoded for semester 14042 (Feb-Jun 2026)
- Blocks: Cannot reuse code for different semesters without manual edit. ICS export will have UNTIL dates that expire after semester ends
- Fix approach: Read semester dates from `courses.json` metadata. Store in atoms for runtime access. Add validation that current semester is active

**Two-Hour Exam Duration Assumption:**
- Files: `src/utils/googleCalendar.ts` (line 102)
- Problem: Exam duration is hardcoded to 2 hours; no data source for actual exam duration
- Blocks: ICS exports will have wrong exam end times, causing calendar overlap warnings
- Fix approach: Add `examDuration` field to Course type or derive from data. Default to 2 hours if not specified

---

## Testing Gaps

**No Unit Tests:**
- Untested areas:
  - `src/utils/conflicts.ts`: Time overlap logic with edge cases (boundary times, same-second start/end)
  - `src/utils/calendar.ts`: Event generation, color assignment, conflict pre-computation
  - `src/utils/googleCalendar.ts`: ICS generation, Jalali date conversion, RRULE formatting
  - `src/hooks/useSchedule.ts`: Schedule CRUD operations, conflict detection on add/update, ID generation
- Files: All utility files and hooks
- Risk: Regressions in core logic go undetected. Refactoring requires manual verification
- Priority: HIGH - Conflicts and calendar logic are critical paths

**No Integration Tests:**
- Missing: End-to-end flows like "add course → detect conflict → export schedule → re-import"
- Risk: Edge cases like importing a schedule with courses that no longer exist in catalog
- Priority: MEDIUM

**No Visual Regression Tests:**
- Missing: Transposed calendar layout stability, tooltip positioning in different viewport sizes
- Risk: Layout bugs go unnoticed until user reports them
- Priority: LOW - Less critical but would prevent regressions

---

## Browser Compatibility Concerns

**Clipboard API Fallback Chain:**
- Files: `src/components/ExportButtons.tsx` (lines 60-87)
- Risk: Web Share API exists but `canShare()` may return false even on supporting browsers. Clipboard write may fail silently. No clear error message if all paths fail
- Current mitigation: Three fallbacks (share → clipboard → download), but final fallback is silent catch
- Recommendations: Add explicit error state for clipboard failures. Show user which export method succeeded/failed

**localStorage Exceptions:**
- Files: `src/App.tsx` (lines 17-23), `src/components/WeeklySchedule.tsx` (lines 29-40)
- Risk: Private browsing or storage quota exceeded throws exceptions that are caught silently. No user feedback
- Current mitigation: Try-catch blocks with empty catch
- Recommendations: Log exceptions. Notify user of storage issues. Fall back to session storage or memory if localStorage is unavailable

---

## Security Considerations

**XSS via Course Notes Field:**
- Risk: Course `notes` field is rendered directly in UI. If notes contain HTML/JavaScript, could execute
- Files: `src/components/CourseSearch.tsx` (line 424), `src/components/WeeklySchedule.tsx` (line 293)
- Current mitigation: React escapes by default, but string injection via imported JSON is not validated
- Recommendations: Sanitize notes on import. Use `DOMPurify` if rich HTML is ever needed

**ICS Injection:**
- Risk: Course names with semicolons/newlines in `src/utils/googleCalendar.ts` could break ICS format if not properly escaped
- Files: `src/utils/googleCalendar.ts` (line 27, escapeICalText)
- Current mitigation: `escapeICalText()` function exists but may not cover all edge cases
- Recommendations: Test with adversarial course names (e.g., `"Test\nBEGIN:VEVENT"`). Consider using a library to generate ICS

**Semester Data Injection:**
- Risk: If `courses.json` is served from untrusted source, malicious data could corrupt schedule
- Files: `src/data/courses.json` (imported in multiple files)
- Current mitigation: Data is static JSON file
- Recommendations: Add checksum/signature verification if data fetching is ever added. Validate schema on load

---

## Known Limitations

**No Support for Variable Time Slots:**
- Limitation: Calendar assumes fixed hour slots (07:00-20:00). Courses shorter than 1 hour or across midnight not supported
- Impact: Some edge-case courses may not render correctly
- Workaround: None - requires significant calendar refactoring

**No Recurring Exam Display:**
- Limitation: Exams are shown only in ExamsTable, not on calendar. ICS export adds them but web view is incomplete
- Impact: Users may miss exam dates when planning
- Fix approach: Add exam events to calendar visualization

**Mobile Experience Limitations:**
- Limitation: Course search UI is hidden on mobile behind a bottom sheet. Calendar rotation feature not available on mobile
- Impact: Mobile users have reduced scheduling flexibility
- Workaround: Use desktop version for complex scheduling

---

## Missing Critical Features

**No Semester Switching:**
- Problem: All code assumes semester 14042. No UI to select different semesters
- Blocks: Multi-semester planning. Updating app for new semester requires code change
- Migration path: Add semester selector in header. Support multiple `courses.json` files or API endpoint

**No Conflict Resolution UI:**
- Problem: When adding a course with conflicts, app shows warning but no UI assistance to resolve
- Blocks: Users must manually remove conflicting courses
- Migration path: Add "swap" interface to replace selected courses with non-conflicting alternatives

**No Undo/Redo:**
- Problem: Each course add/remove is immediate. No way to undo multiple actions
- Blocks: Users may accidentally clear entire schedule
- Migration path: Implement undo stack in `useSchedule()`. Add keyboard shortcuts (Ctrl+Z)

**No Tutor Profile Images:**
- Problem: `TutorProfile` type includes `profileUrl` but never renders images
- Blocks: Incomplete tutor profile feature
- Migration path: Add image rendering in `TutorProfileModal.tsx`

---

*Concerns audit: 2025-02-18*
