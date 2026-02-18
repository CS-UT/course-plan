# Technology Stack

**Analysis Date:** 2026-02-18

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code in `src/`
- JSX/TSX - React components (TypeScript with React syntax)

**Secondary:**
- JavaScript (ES2022+) - Build tooling and scripts
- CSS - RTL-aware styling with Tailwind CSS v4

## Runtime

**Environment:**
- Node.js 22 (CI/CD requirement in `.github/workflows/ci.yml`)
- Browser-based: Targets ES2022

**Package Manager:**
- npm (lockfile: `package-lock.json` present)
- `type: "module"` in package.json for ES modules

## Frameworks

**Core:**
- React 19.2.0 - UI framework, main app in `src/App.tsx`
- React-DOM 19.2.0 - DOM rendering for React

**UI/Calendar:**
- FullCalendar 6.1.20 - Weekly schedule grid visualization
  - `@fullcalendar/react` - React wrapper
  - `@fullcalendar/core` - Core library
  - `@fullcalendar/timegrid` - Week/day grid view
  - `@fullcalendar/interaction` - Event interaction handlers
- Tailwind CSS 4.1.18 - Utility-first CSS framework with RTL support
- `@tailwindcss/vite` 4.1.18 - Vite integration for Tailwind

**State Management:**
- Jotai 2.17.1 - Atomic state management with localStorage persistence
  - Uses `atomWithStorage` in `src/atoms/index.ts`
  - Manages schedules and UI state

**Image Export:**
- html-to-image 1.11.13 - Screen capture and image generation
  - `toJpeg()` for JPG export
  - `toPng()` for PNG export in `src/components/ExportButtons.tsx`

**Calendar/Date Handling:**
- moment-jalaali 0.10.4 - Jalali (Persian) calendar support in `src/utils/googleCalendar.ts`
  - Used for iCalendar (.ics) generation with semester dates

**Fonts:**
- Vazirmatn (Google Font) - Persian typography via `@import url()` in `src/index.css`

## Key Dependencies

**Critical:**
- React 19.2.0 - Framework foundation
- TypeScript 5.9.3 - Type safety and compilation
- Vite 7.3.1 - Build tool and dev server
- Jotai 2.17.1 - State persistence to localStorage

**Calendar/Scheduling:**
- FullCalendar 6.1.20 - Schedule visualization with day-of-week mapping (Saturday-Thursday)
- moment-jalaali 0.10.4 - Persian calendar conversions for exam dates and iCalendar generation

**UI/Export:**
- Tailwind CSS 4.1.18 - All UI styling with dark mode support
- html-to-image 1.11.13 - JPG/PNG image export of schedules
- Vazirmatn font - Proper Persian text rendering

**Development:**
- @vitejs/plugin-react 5.1.1 - React Fast Refresh
- ESLint 9.39.1 - Code linting
- @eslint/js 9.39.1 - ESLint base configs
- typescript-eslint 8.48.0 - TypeScript ESLint support
- eslint-plugin-react-hooks 7.0.1 - React hooks linting
- eslint-plugin-react-refresh 0.4.24 - React Fast Refresh rules
- @types/react 19.2.7, @types/react-dom 19.2.3, @types/node 24.10.1, @types/moment-jalaali 0.7.9 - Type definitions

## Configuration

**Environment:**
- No `.env` files required - Static client-side app with bundled course data
- No runtime environment variables needed
- Course data sourced from `src/data/courses.json` (static JSON)

**Build:**
- `vite.config.ts` - Vite configuration with React and Tailwind plugins
- `tsconfig.json` + `tsconfig.app.json` + `tsconfig.node.json` - TypeScript configuration
- `eslint.config.js` - ESLint rules (TypeScript + React specific)
- `index.html` - HTML entry point with Clarity analytics script
- `src/index.css` - Tailwind CSS imports and custom themes

**CSS Theme:**
- Tailwind CSS v4 with `@theme {}` custom colors in `src/index.css`
- Primary (blue): 50-900 shades
- Accent (green): 50-600 shades
- Warning (amber): 50-600 shades
- Danger (red): 50-600 shades
- Dark mode via `@custom-variant dark` CSS-in-JS approach

## Build & Development Commands

```bash
npm run dev      # Start Vite dev server (hot reload)
npm run build    # TypeScript check + production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
npx tsc --noEmit # TypeScript type check only
```

**Build Pipeline:**
- `npm run build` runs: `tsc -b && vite build`
- Produces optimized bundle in `dist/`
- TypeScript strict mode enabled (`tsconfig.app.json`: `"strict": true`)

## CI/CD

**Pipeline:**
- GitHub Actions in `.github/workflows/ci.yml`
- Runs on: push to main, pull requests to main
- Node.js 22 with npm cache
- Steps: Install → TypeScript check → Lint → Build

## Platform Requirements

**Development:**
- Node.js 22+
- npm 10.0.0+ (package manager)
- Modern browser with ES2022 support

**Production:**
- Deployed to `plan.csut.ir`
- Static hosting (no backend server required)
- Served as static HTML/CSS/JS bundle from `dist/`
- Browser support: Modern browsers (ES2022, FullCalendar 6.x support)

**Data:**
- Static JSON course data: `src/data/courses.json` (~371 courses)
- Data sourced from University of Tehran EMS system report #212
- Updated via browser console scraper script: `scripts/fetch-courses.mjs`

---

*Stack analysis: 2026-02-18*
