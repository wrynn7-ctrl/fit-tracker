import { describe, expect, it } from 'vitest';
import type { Workout } from '../types';
import {
  estimate1RM,
  exerciseHistory,
  fmtWeight,
  fromDisplay,
  lastSession,
  personalRecords,
  prsInWorkout,
  toDisplay,
  weekStart,
  weekStreak,
  workoutVolume,
} from './calc';

const DAY = 86_400_000;

const workout = (id: string, startedAt: number, sets: [number, number, boolean?][], exerciseId = 'bench'): Workout => ({
  id,
  name: id,
  startedAt,
  finishedAt: startedAt + 3600_000,
  exercises: [
    {
      id: `${id}-ex`,
      exerciseId,
      restSec: 90,
      sets: sets.map(([weight, reps, done = true], i) => ({ id: `${id}-${i}`, weight, reps, duration: 0, done })),
    },
  ],
});

describe('units', () => {
  it('round-trips kg and lb', () => {
    expect(fromDisplay(toDisplay(100, 'lb'), 'lb')).toBeCloseTo(100);
    expect(toDisplay(100, 'kg')).toBe(100);
  });
  it('formats to the nearest half unit', () => {
    expect(fmtWeight(100, 'kg')).toBe('100');
    expect(fmtWeight(fromDisplay(225, 'lb'), 'lb')).toBe('225');
    expect(fmtWeight(52.3, 'kg')).toBe('52.5');
  });
});

describe('estimate1RM', () => {
  it('uses Epley and treats a single as its own max', () => {
    expect(estimate1RM(100, 1)).toBe(100);
    expect(estimate1RM(100, 10)).toBeCloseTo(133.33, 1);
    expect(estimate1RM(0, 5)).toBe(0);
  });
});

describe('history & records', () => {
  const t0 = new Date(2026, 0, 5, 10).getTime();
  const workouts = [
    workout('a', t0, [[100, 5], [100, 5], [110, 1, false]]),
    workout('b', t0 + 2 * DAY, [[105, 5], [105, 4]]),
  ];

  it('only counts completed sets toward volume', () => {
    expect(workoutVolume(workouts[0])).toBe(1000);
  });

  it('builds per-exercise history oldest first', () => {
    const h = exerciseHistory(workouts, 'bench');
    expect(h.map((s) => s.workoutId)).toEqual(['a', 'b']);
    expect(h[1].maxWeight).toBe(105);
    expect(personalRecords(h).maxWeight).toBe(105);
  });

  it('finds the last session excluding the active workout', () => {
    expect(lastSession(workouts, 'bench')?.workoutId).toBe('b');
    expect(lastSession(workouts, 'bench', 'b')?.workoutId).toBe('a');
  });

  it('detects PRs against earlier workouts only', () => {
    expect(prsInWorkout(workouts, workouts[1])).toEqual([{ exerciseId: 'bench', kind: 'weight' }]);
    expect(prsInWorkout(workouts, workouts[0])).toEqual([]);
  });
});

describe('weeks', () => {
  it('weekStart returns Monday midnight', () => {
    const wed = new Date(2026, 0, 7, 15).getTime();
    const ws = new Date(weekStart(wed));
    expect(ws.getDay()).toBe(1);
    expect(ws.getDate()).toBe(5);
    expect(ws.getHours()).toBe(0);
  });

  it('counts consecutive training weeks', () => {
    const now = new Date(2026, 0, 21, 12).getTime(); // Wed
    const ws = [workout('x', now - 14 * DAY, [[50, 5]]), workout('y', now - 7 * DAY, [[50, 5]])];
    expect(weekStreak(ws, now)).toBe(2); // this week not trained yet; streak still alive
    expect(weekStreak([...ws, workout('z', now, [[50, 5]])], now)).toBe(3);
    expect(weekStreak([workout('old', now - 21 * DAY, [[50, 5]])], now)).toBe(0);
  });
});
