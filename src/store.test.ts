import { beforeEach, describe, expect, it } from 'vitest';
import { initialData, useStore } from './store';

const s = () => useStore.getState();

describe('workout flow', () => {
  beforeEach(() => useStore.setState(initialData()));

  it('starts from a routine day, logs sets, and finishes', () => {
    s().saveRoutine({
      id: 'r',
      name: 'PPL',
      createdAt: 0,
      days: [{ id: 'd', name: 'Push', exercises: [{ exerciseId: 'barbell-bench-press', sets: 3, reps: 5, restSec: 120 }] }],
    });
    s().startWorkout('r', 'd');
    const ex = s().active!.exercises[0];
    expect(s().active!.name).toBe('PPL · Push');
    expect(ex.sets).toHaveLength(3);
    expect(ex.sets[0].reps).toBe(5);

    s().updateSet(ex.id, ex.sets[0].id, { weight: 100 });
    s().toggleSetDone(ex.id, ex.sets[0].id);
    expect(s().restEndsAt).toBeGreaterThan(Date.now());

    const done = s().finishWorkout()!;
    expect(s().active).toBeNull();
    expect(done.exercises[0].sets).toHaveLength(1); // unchecked sets dropped
    expect(s().workouts).toHaveLength(1);
  });

  it('pre-fills weights from the previous session', () => {
    s().startWorkout();
    s().addExerciseToActive('deadlift');
    const ex = s().active!.exercises[0];
    for (const set of ex.sets) {
      s().updateSet(ex.id, set.id, { weight: 140, reps: 5 });
      s().toggleSetDone(ex.id, set.id);
    }
    s().finishWorkout();

    s().startWorkout();
    s().addExerciseToActive('deadlift');
    const next = s().active!.exercises[0];
    expect(next.sets.map((x) => x.weight)).toEqual([140, 140, 140]);
    expect(next.sets.every((x) => !x.done)).toBe(true);
  });

  it('drops exercises with no completed sets on finish', () => {
    s().startWorkout();
    s().addExerciseToActive('deadlift');
    s().addExerciseToActive('pull-up');
    const [a] = s().active!.exercises;
    s().toggleSetDone(a.id, a.sets[0].id);
    expect(s().finishWorkout()!.exercises.map((e) => e.exerciseId)).toEqual(['deadlift']);
  });
});
