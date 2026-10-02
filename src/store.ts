import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BUILTIN_EXERCISES } from './data/exercises';
import { lastSession } from './lib/calc';
import { uid } from './lib/id';
import type {
  BodyLog,
  Exercise,
  Routine,
  SetEntry,
  Settings,
  Workout,
  WorkoutExercise,
} from './types';

export interface AppData {
  settings: Settings;
  customExercises: Exercise[];
  routines: Routine[];
  workouts: Workout[];
  bodyLogs: BodyLog[];
  active: Workout | null;
  /** Epoch ms when the current rest timer ends, or null. */
  restEndsAt: number | null;
}

interface Actions {
  setSettings: (patch: Partial<Settings>) => void;
  addCustomExercise: (ex: Omit<Exercise, 'id' | 'custom'>) => Exercise;
  deleteCustomExercise: (id: string) => void;
  saveRoutine: (routine: Routine) => void;
  deleteRoutine: (id: string) => void;

  startWorkout: (routineId?: string, dayId?: string) => void;
  addExerciseToActive: (exerciseId: string) => void;
  removeExerciseFromActive: (workoutExerciseId: string) => void;
  moveExerciseInActive: (workoutExerciseId: string, dir: -1 | 1) => void;
  addSet: (workoutExerciseId: string) => void;
  updateSet: (workoutExerciseId: string, setId: string, patch: Partial<SetEntry>) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  toggleSetDone: (workoutExerciseId: string, setId: string) => void;
  setActiveNote: (note: string) => void;
  finishWorkout: () => Workout | null;
  discardWorkout: () => void;
  deleteWorkout: (id: string) => void;

  startRest: (seconds: number) => void;
  adjustRest: (deltaSec: number) => void;
  stopRest: () => void;

  addBodyLog: (log: Omit<BodyLog, 'id'>) => void;
  deleteBodyLog: (id: string) => void;

  importData: (data: Partial<AppData>) => void;
  resetAll: () => void;
}

export type AppState = AppData & Actions;

export const initialData = (): AppData => ({
  settings: { units: 'lb', defaultRestSec: 90 },
  customExercises: [],
  routines: [],
  workouts: [],
  bodyLogs: [],
  active: null,
  restEndsAt: null,
});

const newSet = (prev?: SetEntry): SetEntry => ({
  id: uid(),
  weight: prev?.weight ?? 0,
  reps: prev?.reps ?? 0,
  duration: prev?.duration ?? 0,
  done: false,
});

/** Builds workout sets, pre-filled from the last time this exercise was done. */
const buildExercise = (
  workouts: Workout[],
  exerciseId: string,
  restSec: number,
  targetSets?: number,
  targetReps?: number,
): WorkoutExercise => {
  const last = lastSession(workouts, exerciseId);
  const count = targetSets ?? Math.max(last?.sets.length ?? 0, 3);
  const sets = Array.from({ length: count }, (_, i) => {
    const prev = last?.sets[Math.min(i, last.sets.length - 1)];
    return {
      id: uid(),
      weight: prev?.weight ?? 0,
      reps: targetReps ?? prev?.reps ?? 0,
      duration: prev?.duration ?? 0,
      done: false,
    };
  });
  return { id: uid(), exerciseId, restSec, sets };
};

const mapActiveExercise = (
  state: AppData,
  workoutExerciseId: string,
  fn: (ex: WorkoutExercise) => WorkoutExercise,
): Partial<AppData> =>
  state.active
    ? {
        active: {
          ...state.active,
          exercises: state.active.exercises.map((ex) => (ex.id === workoutExerciseId ? fn(ex) : ex)),
        },
      }
    : {};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      addCustomExercise: (ex) => {
        const created: Exercise = { ...ex, id: `custom-${uid()}`, custom: true };
        set((s) => ({ customExercises: [...s.customExercises, created] }));
        return created;
      },
      deleteCustomExercise: (id) => set((s) => ({ customExercises: s.customExercises.filter((e) => e.id !== id) })),

      saveRoutine: (routine) =>
        set((s) => ({
          routines: s.routines.some((r) => r.id === routine.id)
            ? s.routines.map((r) => (r.id === routine.id ? routine : r))
            : [...s.routines, routine],
        })),
      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),

      startWorkout: (routineId, dayId) => {
        const s = get();
        const routine = s.routines.find((r) => r.id === routineId);
        const day = routine?.days.find((d) => d.id === dayId);
        const exercises = day
          ? day.exercises.map((re) => buildExercise(s.workouts, re.exerciseId, re.restSec, re.sets, re.reps))
          : [];
        set({
          active: {
            id: uid(),
            name: day && routine ? `${routine.name} · ${day.name}` : 'Quick Workout',
            routineId: routine?.id,
            dayId: day?.id,
            startedAt: Date.now(),
            exercises,
          },
          restEndsAt: null,
        });
      },

      addExerciseToActive: (exerciseId) =>
        set((s) =>
          s.active
            ? {
                active: {
                  ...s.active,
                  exercises: [
                    ...s.active.exercises,
                    buildExercise(s.workouts, exerciseId, s.settings.defaultRestSec),
                  ],
                },
              }
            : {},
        ),

      removeExerciseFromActive: (weId) =>
        set((s) =>
          s.active ? { active: { ...s.active, exercises: s.active.exercises.filter((e) => e.id !== weId) } } : {},
        ),

      moveExerciseInActive: (weId, dir) =>
        set((s) => {
          if (!s.active) return {};
          const list = [...s.active.exercises];
          const i = list.findIndex((e) => e.id === weId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= list.length) return {};
          [list[i], list[j]] = [list[j], list[i]];
          return { active: { ...s.active, exercises: list } };
        }),

      addSet: (weId) => set((s) => mapActiveExercise(s, weId, (ex) => ({ ...ex, sets: [...ex.sets, newSet(ex.sets.at(-1))] }))),

      updateSet: (weId, setId, patch) =>
        set((s) =>
          mapActiveExercise(s, weId, (ex) => ({
            ...ex,
            sets: ex.sets.map((st) => (st.id === setId ? { ...st, ...patch } : st)),
          })),
        ),

      removeSet: (weId, setId) =>
        set((s) => mapActiveExercise(s, weId, (ex) => ({ ...ex, sets: ex.sets.filter((st) => st.id !== setId) }))),

      toggleSetDone: (weId, setId) => {
        const s = get();
        const ex = s.active?.exercises.find((e) => e.id === weId);
        const target = ex?.sets.find((st) => st.id === setId);
        if (!ex || !target) return;
        const nowDone = !target.done;
        set({
          ...mapActiveExercise(s, weId, (e) => ({
            ...e,
            sets: e.sets.map((st) => (st.id === setId ? { ...st, done: nowDone } : st)),
          })),
          // Completing a set kicks off the rest timer, like Jefit.
          ...(nowDone && ex.restSec > 0 ? { restEndsAt: Date.now() + ex.restSec * 1000 } : {}),
        });
      },

      setActiveNote: (note) => set((s) => (s.active ? { active: { ...s.active, note } } : {})),

      finishWorkout: () => {
        const { active } = get();
        if (!active) return null;
        const finished: Workout = {
          ...active,
          finishedAt: Date.now(),
          // Drop exercises with no completed sets, and incomplete sets within them.
          exercises: active.exercises
            .map((ex) => ({ ...ex, sets: ex.sets.filter((st) => st.done) }))
            .filter((ex) => ex.sets.length > 0),
        };
        set((s) => ({ workouts: [...s.workouts, finished], active: null, restEndsAt: null }));
        return finished;
      },

      discardWorkout: () => set({ active: null, restEndsAt: null }),

      deleteWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000 }),
      adjustRest: (delta) =>
        set((s) => (s.restEndsAt ? { restEndsAt: Math.max(Date.now(), s.restEndsAt + delta * 1000) } : {})),
      stopRest: () => set({ restEndsAt: null }),

      addBodyLog: (log) =>
        set((s) => ({ bodyLogs: [...s.bodyLogs, { ...log, id: uid() }].sort((a, b) => a.date - b.date) })),
      deleteBodyLog: (id) => set((s) => ({ bodyLogs: s.bodyLogs.filter((b) => b.id !== id) })),

      importData: (data) => set({ ...initialData(), ...data }),
      resetAll: () => set(initialData()),
    }),
    { name: 'fit-tracker', version: 1 },
  ),
);

export const exportData = (s: AppData): AppData => ({
  settings: s.settings,
  customExercises: s.customExercises,
  routines: s.routines,
  workouts: s.workouts,
  bodyLogs: s.bodyLogs,
  active: s.active,
  restEndsAt: null,
});

export const allExercises = (custom: Exercise[]) => [...BUILTIN_EXERCISES, ...custom];

export const useExercises = () => {
  const custom = useStore((s) => s.customExercises);
  return useMemo(() => allExercises(custom), [custom]);
};

export const useExerciseMap = () => {
  const list = useExercises();
  return useMemo(() => new Map(list.map((e) => [e.id, e])), [list]);
};
