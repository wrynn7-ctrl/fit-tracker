import type { SetEntry, Units, Workout, WorkoutExercise } from '../types';

const LB_PER_KG = 2.2046226218;

export const toDisplay = (kg: number, units: Units) => (units === 'kg' ? kg : kg * LB_PER_KG);
export const fromDisplay = (value: number, units: Units) => (units === 'kg' ? value : value / LB_PER_KG);

/** Round to the nearest 0.5 display unit, trimming trailing ".0". */
export const fmtWeight = (kg: number, units: Units) => {
  const v = Math.round(toDisplay(kg, units) * 2) / 2;
  return `${Number.isInteger(v) ? v : v.toFixed(1)}`;
};

/** Epley estimated one-rep max. A single rep is its own max. */
export const estimate1RM = (weight: number, reps: number) => {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

export const completedSets = (ex: WorkoutExercise): SetEntry[] => ex.sets.filter((s) => s.done);

export const setVolume = (s: SetEntry) => s.weight * s.reps;

export const workoutVolume = (w: Workout) =>
  w.exercises.reduce((sum, ex) => sum + completedSets(ex).reduce((a, s) => a + setVolume(s), 0), 0);

export const workoutSetCount = (w: Workout) => w.exercises.reduce((n, ex) => n + completedSets(ex).length, 0);

export const fmtDuration = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return r ? `${m}:${String(r).padStart(2, '0')}` : `${m}m`;
  return `${r}s`;
};

export const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export interface ExerciseSession {
  workoutId: string;
  date: number;
  sets: SetEntry[];
  bestE1RM: number;
  maxWeight: number;
  maxReps: number;
  volume: number;
}

/** Completed sessions of one exercise across finished workouts, oldest first. */
export const exerciseHistory = (workouts: Workout[], exerciseId: string): ExerciseSession[] =>
  workouts
    .filter((w) => w.finishedAt)
    .flatMap((w) =>
      w.exercises
        .filter((ex) => ex.exerciseId === exerciseId)
        .map((ex) => {
          const sets = completedSets(ex);
          return {
            workoutId: w.id,
            date: w.startedAt,
            sets,
            bestE1RM: Math.max(0, ...sets.map((s) => estimate1RM(s.weight, s.reps))),
            maxWeight: Math.max(0, ...sets.map((s) => s.weight)),
            maxReps: Math.max(0, ...sets.map((s) => s.reps)),
            volume: sets.reduce((a, s) => a + setVolume(s), 0),
          };
        })
        .filter((s) => s.sets.length > 0),
    )
    .sort((a, b) => a.date - b.date);

export interface PersonalRecords {
  bestE1RM: number;
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
}

export const personalRecords = (history: ExerciseSession[]): PersonalRecords => ({
  bestE1RM: Math.max(0, ...history.map((h) => h.bestE1RM)),
  maxWeight: Math.max(0, ...history.map((h) => h.maxWeight)),
  maxReps: Math.max(0, ...history.map((h) => h.maxReps)),
  maxVolume: Math.max(0, ...history.map((h) => h.volume)),
});

/** Most recent finished session for an exercise, excluding a given workout (e.g. the one in progress). */
export const lastSession = (workouts: Workout[], exerciseId: string, excludeWorkoutId?: string) => {
  const hist = exerciseHistory(
    workouts.filter((w) => w.id !== excludeWorkoutId),
    exerciseId,
  );
  return hist[hist.length - 1];
};

/** New PRs set in a workout compared with all earlier finished workouts. */
export const prsInWorkout = (workouts: Workout[], workout: Workout) => {
  const earlier = workouts.filter((w) => w.finishedAt && w.startedAt < workout.startedAt && w.id !== workout.id);
  const result: { exerciseId: string; kind: 'e1RM' | 'weight' }[] = [];
  for (const ex of workout.exercises) {
    const sets = completedSets(ex);
    if (!sets.length) continue;
    const prev = personalRecords(exerciseHistory(earlier, ex.exerciseId));
    const e1rm = Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps)));
    const maxW = Math.max(...sets.map((s) => s.weight));
    if (prev.maxWeight > 0 && maxW > prev.maxWeight) result.push({ exerciseId: ex.exerciseId, kind: 'weight' });
    else if (prev.bestE1RM > 0 && e1rm > prev.bestE1RM) result.push({ exerciseId: ex.exerciseId, kind: 'e1RM' });
  }
  return result;
};

/** Start of the ISO-ish week (Monday 00:00 local) containing ts. */
export const weekStart = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
};

/** Consecutive weeks (ending this week or last) with at least one finished workout. */
export const weekStreak = (workouts: Workout[], now = Date.now()) => {
  const weeks = new Set(workouts.filter((w) => w.finishedAt).map((w) => weekStart(w.startedAt)));
  let cursor = weekStart(now);
  if (!weeks.has(cursor)) cursor = weekStart(cursor - 1);
  let streak = 0;
  while (weeks.has(cursor)) {
    streak++;
    cursor = weekStart(cursor - 1);
  }
  return streak;
};
