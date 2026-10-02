# FitTracker

A Jefit-style workout tracker. It's a mobile-first web app (installable as a PWA) that works fully offline, with optional cloud sync across devices.

## Features

- **Exercise library**: about 80 built-in exercises you can filter by muscle group and equipment, plus your own custom exercises (tracked by weight × reps, reps only, or duration).
- **Routines**: multi-day plans with target sets, reps and rest for each exercise. Includes Push/Pull/Legs, Upper/Lower and Full Body templates.
- **Live workout logging**
  - Start from a routine day or start an empty workout.
  - Sets are pre-filled with what you did last time, and a "Previous" column shows your last session.
  - Checking off a set starts the rest timer (±15s, skip, beep/vibrate when it ends).
  - Add or reorder exercises during a workout, add notes, and see a live estimated 1RM.
- **History**: workouts grouped by month, a 5-week training calendar, and per-workout summaries with personal-record (PR) badges.
- **Exercise progress**: PRs (estimated 1RM, heaviest weight, most reps) and charts of estimated 1RM, max weight, volume and reps over time.
- **Progress dashboard**: weekly volume, workouts per week, sets per muscle group (last 30 days), and a body weight / body fat log with a chart.
- **Cloud sync (optional)**: sign in with email and password to back up your data and sync it across devices. Works offline and catches up when you reconnect.
- **Settings**: lb/kg units, default rest time, and JSON export/import for backups.

## Development

```bash
npm install
npm run dev        # start dev server
npm test           # unit tests (vitest)
npm run build      # typecheck + production build into dist/
```

Stack: React 19, TypeScript, Vite, React Router (hash routing, so `dist/` can be hosted on any static host), Zustand (persisted to `localStorage`), Supabase for optional sync. The schema tests run the real SQL against an in-process Postgres (PGlite).

## Cloud sync setup

Sync uses [Supabase](https://supabase.com) (the free tier is plenty). Without it, the app runs local-only.

1. Create a Supabase project.
2. In the project's **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy `.env.example` to `.env.local` and fill in the **Project URL** and **anon public key** from *Project Settings → API*.
4. Under *Authentication → URL Configuration*, set the **Site URL** to where the app is hosted (e.g. `http://localhost:5173` for dev). Confirmation emails link there.
5. Restart `npm run dev` (or rebuild). Then go to **Settings → Cloud sync** and create an account.

The anon key is meant to be public. Row-level security in the schema makes sure each user can only read and write their own rows.

**How it works**
- Each workout, routine, custom exercise, body-weight entry, and the settings is stored as its own row.
- Edits are queued locally and pushed a moment later. Changes from other devices are pulled when the app opens, regains focus, comes back online, and every minute.
- If two devices edit the same item, the most recent edit wins. Deletes sync too.
- A workout in progress stays on the device it's on until you finish it.
- The first time a device signs in, everything already on it is uploaded and merged into the account. Where the same item exists on both sides (for example, settings), the account's copy wins.

## Project layout

```
src/
  data/        built-in exercises and routine templates
  lib/calc.ts  1RM, volume, PRs, streaks, unit conversion
  store.ts     app state + actions (routines, active workout, history, body logs)
  pages/       Home, Routines, RoutineEdit, ActiveWorkout, Exercises, ExerciseDetail,
               History, WorkoutDetail, Progress, Settings
  components/  layout, rest timer, exercise picker, SVG charts, cloud sync panel
  sync/        sync engine (backend-agnostic, unit tested) + Supabase wiring
supabase/
  schema.sql   table, row-level security, and push_records() function
```

Weights are stored in kg internally and converted for display.
