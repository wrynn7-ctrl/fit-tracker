# FitTracker

A Jefit-style workout tracker. It's a mobile-first web app (installable as a PWA) that stores all data locally on your device.

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
- **Settings**: lb/kg units, default rest time, and JSON export/import for backups.

## Development

```bash
npm install
npm run dev        # start dev server
npm test           # unit tests (vitest)
npm run build      # typecheck + production build into dist/
```

Stack: React 19, TypeScript, Vite, React Router (hash routing, so `dist/` can be hosted on any static host), Zustand (persisted to `localStorage`).

## Project layout

```
src/
  data/        built-in exercises and routine templates
  lib/calc.ts  1RM, volume, PRs, streaks, unit conversion
  store.ts     app state + actions (routines, active workout, history, body logs)
  pages/       Home, Routines, RoutineEdit, ActiveWorkout, Exercises, ExerciseDetail,
               History, WorkoutDetail, Progress, Settings
  components/  layout, rest timer, exercise picker, SVG charts
```

Weights are stored in kg internally and converted for display.
