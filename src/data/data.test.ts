import { describe, expect, it } from 'vitest';
import { BUILTIN_EXERCISES } from './exercises';
import { ROUTINE_TEMPLATES } from './templates';

describe('built-in data', () => {
  it('has unique exercise ids', () => {
    const ids = BUILTIN_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('templates only reference existing exercises', () => {
    const ids = new Set(BUILTIN_EXERCISES.map((e) => e.id));
    for (const t of ROUTINE_TEMPLATES)
      for (const d of t.build().days) for (const e of d.exercises) expect(ids, `${t.name}: ${e.exerciseId}`).toContain(e.exerciseId);
  });
});
