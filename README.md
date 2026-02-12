# plan.csut.ir

برنامه‌ریزی هفتگی دروس دانشکده ریاضی، آمار و علوم کامپیوتر دانشگاه تهران.

Static client-side app — no backend. Course data is a static JSON file scraped from the university's EMS system. Tutor reviews are parsed from the [@UTeacherz](https://t.me/UTeacherz) Telegram channel.

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
   https://ems2.ut.ac.ir/browser/fa/#/pages?fid=212&ftype=1&seq=0&subfrm=&sguid=a14c4d27-9c7d-474d-a8fa-77ba71cb171e&TrmType=2#212
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
   Files are processed in alphabetical order — later files override earlier ones for the same course+group. Name them sequentially (001.json, 002.json, ...).

2. Run the merge script:
   ```bash
   node scripts/merge-courses.mjs
   ```
   This reads all JSON files from `src/data/gathered_data/`, expands the compact scraped format into the full Course schema, and writes `src/data/courses.json`.

3. Update the semester label if needed — edit `semesterLabel` in `scripts/merge-courses.mjs`.

## Updating Tutor Reviews

Tutor reviews are sourced from the [@UTeacherz](https://t.me/UTeacherz) Telegram channel. The parser script extracts reviews from a Telegram chat export and matches tutors to professors in `courses.json`.

### Step 1: Export the Telegram channel

1. Open **Telegram Desktop** (not mobile — only Desktop supports JSON export)
2. Open the [@UTeacherz](https://t.me/UTeacherz) channel
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
