# plan.csut.ir

برنامه‌ریزی هفتگی دروس دانشکده ریاضی، آمار و علوم کامپیوتر دانشگاه تهران.

Static client-side app — no backend. Course data is a static JSON file scraped from the university's EMS system. Tutor reviews were parsed from the [@UTeacherz](https://t.me/UTeacherz) Telegram channel (deleted in 1405 for an unknown reason; the channel and post links no longer work).

## Setup

```bash
npm install
npm run dev       # dev server
npm run build     # typecheck + production build
npm run lint      # eslint
```

## Updating Course Data

Course data comes from EMS Report #212. The scraper is a browser console script that paginates through the report and downloads a JSON file.

> Report #212 only shows courses the logged-in student hasn't passed yet. To get the full list, the scraper should be run by a new student (e.g. a freshman who hasn't passed any courses).

### Step 1: Scrape courses from EMS

1. Open Chrome and go to the EMS report page:
   ```
   https://ems2.ut.ac.ir/browser/fa/#/pages?fid=212&ftype=1&seq=0&subfrm=&sguid=bbf5f331-5c32-42a5-b826-9fdbe25933cb&TrmType=2#212
   ```
2. Log in with your SSO credentials
3. Wait for the first page of the course table to fully load
4. Open DevTools (`F12`) → Console tab
5. Copy the entire contents of `scripts/fetch-courses.mjs` and paste into the console, then press Enter
6. Wait for it to iterate through all pages — progress is logged to the console
7. A `courses.json` file will automatically download

### Step 2: Merge into the app

1. Copy the downloaded `courses.json` into `src/data/gathered_data/` with a sequential filename:
   ```bash
   cp ~/Downloads/courses.json src/data/gathered_data/007.json
   ```
   Name snapshots sequentially (001.json, 002.json, ...). Because Report #212 hides courses each student has already passed, collect exports from multiple accounts when possible. Set `ACTIVE_SNAPSHOT_START` in `scripts/merge-courses.mjs` to the first snapshot for the current semester; all snapshots from that file onward are unioned, and later files win for duplicate course/group rows.

2. Run the merge script:
   ```bash
   node scripts/merge-courses.mjs
   ```
   This combines the current semester's EMS snapshots for عمومی offerings, then replaces تخصصی offerings with the final, deduplicated faculty-schedule rows in `src/data/semester-14051-specialized.json`, and writes `src/data/courses.json`.

3. For a new semester, update `src/data/semester-14051-specialized.json` from the final faculty weekly and exam schedules. These rows are authoritative for تخصصی offerings and replace EMS تخصصی rows, so the file must contain the complete deduplicated list for the semester.

## Updating Tutor Reviews

Tutor reviews were sourced from the [@UTeacherz](https://t.me/UTeacherz) Telegram channel (deleted in 1405 for an unknown reason; the channel and post links no longer work). The parser script extracts reviews from an existing Telegram chat export and matches tutors to professors in `courses.json`.

### Step 1: Export the Telegram channel

1. Open **Telegram Desktop** (not mobile — only Desktop supports JSON export)
2. Use an existing export of the [@UTeacherz](https://t.me/UTeacherz) channel (deleted in 1405 for an unknown reason)
3. Click the three-dot menu (⋮) at the top right → **Export chat history**
4. In the export dialog:
   - Uncheck all media types (photos, videos, etc.) — only messages are needed
   - Format: **Machine-readable JSON**
   - Path: anywhere convenient (e.g. `~/Downloads/`)
5. Click **Export** and wait for it to finish
6. The export produces a `result.json` file

### Step 2: Run the parser

```bash
node scripts/parse-tutor-reviews.mjs ~/Downloads/result.json
```

This outputs:
- `src/data/tutors.json` — all tutor profiles with reviews (lazy-loaded at runtime)
- `src/data/tutor-name-map.json` — mapping of professor names (from courses.json) to tutor IDs

The parser handles multiple message formats from the channel (structured ratings, prose reviews, profiles with rank/workplace, etc.) and uses fuzzy Persian name matching to link tutors to course professors.

### Step 3: Verify and build

```bash
npm run build
```

Check the console output from the parser to verify match quality — it logs every matched tutor → professor pair. Currently ~110 out of ~200 professors have linked reviews.
