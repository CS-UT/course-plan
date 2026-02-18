# External Integrations

**Analysis Date:** 2026-02-18

## APIs & External Services

**Analytics:**
- Microsoft Clarity (Web Insights)
  - Script: injected in `index.html` (lines 10-14)
  - Endpoint: `https://www.clarity.ms/tag/vgb985tfez`
  - Purpose: Anonymous session recording and user behavior analytics
  - No auth required - tracking ID embedded in HTML

**GitHub:**
- GitHub repository link in header
  - URL: `https://github.com/CS-UT/course-plan`
  - Purpose: Source code hosting and version control reference
  - No API integration - just link in UI (`src/App.tsx` line 99)

**Telegram:**
- Telegram Bot Integration (Tutor Reviews)
  - Source: `https://t.me/UTeacherz` - @UTeacherz bot
  - Integration: Links in `src/components/TutorProfileModal.tsx` (lines 147, 264)
  - Purpose: Tutor profile reviews and ratings data
  - Data flow: Static tutor reviews embedded in `src/data/tutors.json`
  - No API calls - data is pre-scraped and bundled

## Data Storage

**Databases:**
- None - Static client-side only

**File Storage:**
- Local filesystem (browser):
  - Source: Static `src/data/courses.json` (~371 courses from UT EMS)
  - Bundled with app at build time
  - No remote file storage APIs used

**Client-Side Storage:**
- Browser localStorage (via Jotai `atomWithStorage`):
  - `plan-schedules` - Selected courses per schedule
  - `plan-currentScheduleId` - Active schedule ID
  - `plan-dark-mode` - Dark mode preference
  - `plan-mobile-banner-dismissed` - Mobile UX state
  - Implementation: `src/atoms/index.ts`, `src/App.tsx`

**Caching:**
- No HTTP caching layer
- Browser cache handles static assets
- No server-side caching (static deployment)

## Authentication & Identity

**Auth Provider:**
- None required
- Application is public and doesn't require login
- University EMS data is static and pre-compiled

**Data Access:**
- Course data sourced from UT EMS Report #212
  - Manual scraping via browser console script
  - User must be logged into `ems2.ut.ac.ir` to run scraper
  - Scraper: `scripts/fetch-courses.mjs` (browser console paste-and-run)
  - Output: JSON downloaded to `src/data/courses.json`

## Monitoring & Observability

**Error Tracking:**
- No dedicated error tracking service
- Browser console logging only (`console.error()` in `src/components/ExportButtons.tsx` line 46)

**Logs:**
- Client-side only: console output in development
- No server logs (static deployment)
- No error reporting to external services

## Export & Calendar Integrations

**Calendar Export:**
- iCalendar (.ics) format generation
  - Implementation: `src/utils/googleCalendar.ts`
  - Generates RFC 5545 compliant ICAL format
  - Download function: `downloadICS()` in `src/components/ExportButtons.tsx` (line 114)
  - Features:
    - Weekly recurring events (RRULE)
    - Exam events (separate VEVENT entries)
    - Persian timezone (Asia/Tehran TZID)
    - Supports: Google Calendar, Apple Calendar, Outlook, etc.

**Image Export:**
- JPG/PNG export to local filesystem
  - Library: html-to-image 1.11.13
  - Functions: `downloadImage()`, `shareImage()` in `src/components/ExportButtons.tsx`
  - Uses `toJpeg()` for quality 0.92 @ 2x pixel ratio
  - Excludes elements with `data-export-exclude` attribute

**JSON Import/Export:**
- Local file-based schedule backup
  - Export: `exportSchedule()` saves `{ courses: [] }` JSON
  - Import: `handleImport()` reads JSON and validates structure
  - File format: `{ "courses": [{ "courseCode": "string", "group": number }] }`
  - Implementation: `src/components/ExportButtons.tsx` (lines 117-187)

**Web Share API:**
- Native OS sharing (mobile)
  - API: `navigator.share()` and `navigator.canShare()`
  - Fallback chain: Share API → Clipboard → Download
  - Implementation: `shareImage()` in `src/components/ExportButtons.tsx` (lines 53-107)
  - Browser support: Modern mobile browsers

## Environment Configuration

**Required env vars:**
- None - Static app with no runtime configuration needed

**Secrets location:**
- No secrets required
- Analytics tracking ID embedded in HTML (`index.html`)

**Course Data Pipeline:**
- Static file: `src/data/courses.json`
- Data refresh process:
  1. Run `scripts/fetch-courses.mjs` in browser console at `ems2.ut.ac.ir/browser/fa/...report#212`
  2. Script uses Knockout.js ViewModel to paginate NpGrid
  3. Scrapes: courseCode, courseName, professor, sessions, examDate, location, prerequisites
  4. Downloads JSON file
  5. Copy to `src/data/gathered_data/` and run merge script
  6. Commit updated `src/data/courses.json`
  7. Deploy via GitHub Actions CI/CD

## Webhooks & Callbacks

**Incoming:**
- None - No server, no webhooks

**Outgoing:**
- None - No external API calls

---

*Integration audit: 2026-02-18*
