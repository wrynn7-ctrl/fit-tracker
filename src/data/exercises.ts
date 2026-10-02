import type { Equipment, Exercise, ExerciseKind, MuscleGroup } from '../types';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Abs',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Cardio',
];

export const EQUIPMENT: Equipment[] = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Kettlebell',
  'Band',
  'Other',
];

type Row = [name: string, muscle: MuscleGroup, equipment: Equipment, kind?: ExerciseKind, secondary?: MuscleGroup[]];

const rows: Row[] = [
  // Chest
  ['Barbell Bench Press', 'Chest', 'Barbell', 'weight_reps', ['Triceps', 'Shoulders']],
  ['Incline Barbell Bench Press', 'Chest', 'Barbell', 'weight_reps', ['Shoulders', 'Triceps']],
  ['Decline Barbell Bench Press', 'Chest', 'Barbell', 'weight_reps', ['Triceps']],
  ['Dumbbell Bench Press', 'Chest', 'Dumbbell', 'weight_reps', ['Triceps', 'Shoulders']],
  ['Incline Dumbbell Press', 'Chest', 'Dumbbell', 'weight_reps', ['Shoulders', 'Triceps']],
  ['Dumbbell Fly', 'Chest', 'Dumbbell'],
  ['Cable Crossover', 'Chest', 'Cable'],
  ['Machine Chest Press', 'Chest', 'Machine', 'weight_reps', ['Triceps']],
  ['Pec Deck', 'Chest', 'Machine'],
  ['Push-Up', 'Chest', 'Bodyweight', 'reps', ['Triceps', 'Shoulders']],
  ['Chest Dip', 'Chest', 'Bodyweight', 'reps', ['Triceps']],
  // Back
  ['Deadlift', 'Back', 'Barbell', 'weight_reps', ['Hamstrings', 'Glutes']],
  ['Barbell Row', 'Back', 'Barbell', 'weight_reps', ['Biceps']],
  ['Pendlay Row', 'Back', 'Barbell', 'weight_reps', ['Biceps']],
  ['Dumbbell Row', 'Back', 'Dumbbell', 'weight_reps', ['Biceps']],
  ['Pull-Up', 'Back', 'Bodyweight', 'reps', ['Biceps']],
  ['Chin-Up', 'Back', 'Bodyweight', 'reps', ['Biceps']],
  ['Lat Pulldown', 'Back', 'Cable', 'weight_reps', ['Biceps']],
  ['Seated Cable Row', 'Back', 'Cable', 'weight_reps', ['Biceps']],
  ['T-Bar Row', 'Back', 'Barbell', 'weight_reps', ['Biceps']],
  ['Machine Row', 'Back', 'Machine', 'weight_reps', ['Biceps']],
  ['Straight-Arm Pulldown', 'Back', 'Cable'],
  ['Back Extension', 'Back', 'Bodyweight', 'reps', ['Glutes', 'Hamstrings']],
  // Shoulders
  ['Overhead Press', 'Shoulders', 'Barbell', 'weight_reps', ['Triceps']],
  ['Seated Dumbbell Press', 'Shoulders', 'Dumbbell', 'weight_reps', ['Triceps']],
  ['Arnold Press', 'Shoulders', 'Dumbbell', 'weight_reps', ['Triceps']],
  ['Lateral Raise', 'Shoulders', 'Dumbbell'],
  ['Cable Lateral Raise', 'Shoulders', 'Cable'],
  ['Front Raise', 'Shoulders', 'Dumbbell'],
  ['Rear Delt Fly', 'Shoulders', 'Dumbbell', 'weight_reps', ['Back']],
  ['Face Pull', 'Shoulders', 'Cable', 'weight_reps', ['Back']],
  ['Machine Shoulder Press', 'Shoulders', 'Machine', 'weight_reps', ['Triceps']],
  ['Barbell Shrug', 'Shoulders', 'Barbell', 'weight_reps', ['Back']],
  // Biceps
  ['Barbell Curl', 'Biceps', 'Barbell', 'weight_reps', ['Forearms']],
  ['EZ-Bar Curl', 'Biceps', 'Barbell', 'weight_reps', ['Forearms']],
  ['Dumbbell Curl', 'Biceps', 'Dumbbell', 'weight_reps', ['Forearms']],
  ['Hammer Curl', 'Biceps', 'Dumbbell', 'weight_reps', ['Forearms']],
  ['Incline Dumbbell Curl', 'Biceps', 'Dumbbell'],
  ['Preacher Curl', 'Biceps', 'Machine'],
  ['Cable Curl', 'Biceps', 'Cable'],
  ['Concentration Curl', 'Biceps', 'Dumbbell'],
  // Triceps
  ['Close-Grip Bench Press', 'Triceps', 'Barbell', 'weight_reps', ['Chest']],
  ['Skull Crusher', 'Triceps', 'Barbell'],
  ['Triceps Pushdown', 'Triceps', 'Cable'],
  ['Overhead Cable Extension', 'Triceps', 'Cable'],
  ['Overhead Dumbbell Extension', 'Triceps', 'Dumbbell'],
  ['Triceps Dip', 'Triceps', 'Bodyweight', 'reps', ['Chest']],
  ['Dumbbell Kickback', 'Triceps', 'Dumbbell'],
  // Forearms
  ['Wrist Curl', 'Forearms', 'Barbell'],
  ['Reverse Wrist Curl', 'Forearms', 'Barbell'],
  ["Farmer's Walk", 'Forearms', 'Dumbbell', 'duration', ['Shoulders']],
  // Abs
  ['Crunch', 'Abs', 'Bodyweight', 'reps'],
  ['Hanging Leg Raise', 'Abs', 'Bodyweight', 'reps'],
  ['Cable Crunch', 'Abs', 'Cable'],
  ['Plank', 'Abs', 'Bodyweight', 'duration'],
  ['Side Plank', 'Abs', 'Bodyweight', 'duration'],
  ['Russian Twist', 'Abs', 'Bodyweight', 'reps'],
  ['Ab Wheel Rollout', 'Abs', 'Other', 'reps'],
  // Quads
  ['Barbell Back Squat', 'Quads', 'Barbell', 'weight_reps', ['Glutes', 'Hamstrings']],
  ['Front Squat', 'Quads', 'Barbell', 'weight_reps', ['Glutes']],
  ['Leg Press', 'Quads', 'Machine', 'weight_reps', ['Glutes']],
  ['Hack Squat', 'Quads', 'Machine', 'weight_reps', ['Glutes']],
  ['Leg Extension', 'Quads', 'Machine'],
  ['Goblet Squat', 'Quads', 'Dumbbell', 'weight_reps', ['Glutes']],
  ['Bulgarian Split Squat', 'Quads', 'Dumbbell', 'weight_reps', ['Glutes']],
  ['Walking Lunge', 'Quads', 'Dumbbell', 'weight_reps', ['Glutes']],
  // Hamstrings
  ['Romanian Deadlift', 'Hamstrings', 'Barbell', 'weight_reps', ['Glutes', 'Back']],
  ['Lying Leg Curl', 'Hamstrings', 'Machine'],
  ['Seated Leg Curl', 'Hamstrings', 'Machine'],
  ['Good Morning', 'Hamstrings', 'Barbell', 'weight_reps', ['Back']],
  ['Nordic Curl', 'Hamstrings', 'Bodyweight', 'reps'],
  // Glutes
  ['Hip Thrust', 'Glutes', 'Barbell', 'weight_reps', ['Hamstrings']],
  ['Glute Bridge', 'Glutes', 'Bodyweight', 'reps'],
  ['Cable Kickback', 'Glutes', 'Cable'],
  ['Kettlebell Swing', 'Glutes', 'Kettlebell', 'weight_reps', ['Hamstrings']],
  // Calves
  ['Standing Calf Raise', 'Calves', 'Machine'],
  ['Seated Calf Raise', 'Calves', 'Machine'],
  // Cardio
  ['Running', 'Cardio', 'Other', 'duration'],
  ['Cycling', 'Cardio', 'Machine', 'duration'],
  ['Rowing Machine', 'Cardio', 'Machine', 'duration'],
  ['Jump Rope', 'Cardio', 'Other', 'duration'],
  ['Stair Climber', 'Cardio', 'Machine', 'duration'],
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const BUILTIN_EXERCISES: Exercise[] = rows.map(([name, muscle, equipment, kind = 'weight_reps', secondary]) => ({
  id: slug(name),
  name,
  muscle,
  equipment,
  kind,
  secondary,
}));
