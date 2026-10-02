export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Abs'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Cardio';

export type Equipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Band'
  | 'Other';

/** How a set is recorded. Weight/reps for lifting, duration for planks and cardio. */
export type ExerciseKind = 'weight_reps' | 'reps' | 'duration';

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  secondary?: MuscleGroup[];
  equipment: Equipment;
  kind: ExerciseKind;
  custom?: boolean;
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  restSec: number;
}

export interface RoutineDay {
  id: string;
  name: string;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  name: string;
  days: RoutineDay[];
  createdAt: number;
}

export interface SetEntry {
  id: string;
  /** kg internally; converted for display based on settings. */
  weight: number;
  reps: number;
  /** seconds, for duration exercises */
  duration: number;
  done: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  restSec: number;
  sets: SetEntry[];
  note?: string;
}

export interface Workout {
  id: string;
  name: string;
  routineId?: string;
  dayId?: string;
  startedAt: number;
  finishedAt?: number;
  exercises: WorkoutExercise[];
  note?: string;
}

export interface BodyLog {
  id: string;
  date: number;
  /** kg */
  weight?: number;
  bodyFat?: number;
}

export type Units = 'kg' | 'lb';

export interface Settings {
  units: Units;
  defaultRestSec: number;
}
