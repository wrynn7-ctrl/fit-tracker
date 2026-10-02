import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ExercisePicker } from '../components/ExercisePicker';
import { uid } from '../lib/id';
import { useExerciseMap, useStore } from '../store';
import type { Routine, RoutineDay, RoutineExercise } from '../types';

export function RoutineEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routine = useStore((s) => s.routines.find((r) => r.id === id));
  const { saveRoutine, deleteRoutine, startWorkout, settings, active } = useStore();
  const exMap = useExerciseMap();
  const [dayIdx, setDayIdx] = useState(0);
  const [picking, setPicking] = useState(false);

  if (!routine) return <Navigate to="/routines" replace />;
  const day = routine.days[Math.min(dayIdx, routine.days.length - 1)];

  const update = (patch: Partial<Routine>) => saveRoutine({ ...routine, ...patch });
  const updateDay = (dayId: string, fn: (d: RoutineDay) => RoutineDay) =>
    update({ days: routine.days.map((d) => (d.id === dayId ? fn(d) : d)) });
  const updateEx = (i: number, patch: Partial<RoutineExercise>) =>
    day && updateDay(day.id, (d) => ({ ...d, exercises: d.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) }));
  const moveEx = (i: number, dir: -1 | 1) =>
    day &&
    updateDay(day.id, (d) => {
      const list = [...d.exercises];
      const j = i + dir;
      if (j < 0 || j >= list.length) return d;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...d, exercises: list };
    });

  const addDay = () => {
    update({ days: [...routine.days, { id: uid(), name: `Day ${routine.days.length + 1}`, exercises: [] }] });
    setDayIdx(routine.days.length);
  };
  const removeDay = () => {
    if (!day || !confirm(`Delete "${day.name}"?`)) return;
    update({ days: routine.days.filter((d) => d.id !== day.id) });
    setDayIdx(0);
  };

  const startDay = () => {
    if (!day) return;
    if (active && !confirm('A workout is already in progress. Discard it and start this day?')) return;
    startWorkout(routine.id, day.id);
    navigate('/workout');
  };

  return (
    <div className="page">
      <header className="page-head">
        <button className="icon-btn" onClick={() => navigate('/routines')} aria-label="Back">
          ‹
        </button>
        <input
          className="title-input"
          value={routine.name}
          onChange={(e) => update({ name: e.target.value })}
          aria-label="Routine name"
        />
      </header>

      <div className="tabs-inline">
        {routine.days.map((d, i) => (
          <button key={d.id} className={`chip ${d.id === day?.id ? 'active' : ''}`} onClick={() => setDayIdx(i)}>
            {d.name || `Day ${i + 1}`}
          </button>
        ))}
        <button className="chip" onClick={addDay}>
          + Day
        </button>
      </div>

      {day ? (
        <section className="card">
          <div className="row">
            <input
              className="input grow"
              value={day.name}
              onChange={(e) => updateDay(day.id, (d) => ({ ...d, name: e.target.value }))}
              aria-label="Day name"
            />
            <button className="btn danger ghost" onClick={removeDay}>
              Delete day
            </button>
          </div>

          {day.exercises.length === 0 && <p className="muted empty">No exercises on this day yet.</p>}
          {day.exercises.map((re, i) => {
            const ex = exMap.get(re.exerciseId);
            return (
              <div key={`${re.exerciseId}-${i}`} className="routine-ex">
                <div className="row between">
                  <strong>{ex?.name ?? 'Unknown exercise'}</strong>
                  <span className="row tight">
                    <button className="icon-btn" onClick={() => moveEx(i, -1)} aria-label="Move up">
                      ↑
                    </button>
                    <button className="icon-btn" onClick={() => moveEx(i, 1)} aria-label="Move down">
                      ↓
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Remove"
                      onClick={() =>
                        updateDay(day.id, (d) => ({ ...d, exercises: d.exercises.filter((_, j) => j !== i) }))
                      }
                    >
                      ✕
                    </button>
                  </span>
                </div>
                <div className="row fields">
                  <NumField label="Sets" value={re.sets} min={1} onChange={(v) => updateEx(i, { sets: v })} />
                  <NumField
                    label={ex?.kind === 'duration' ? 'Target (s)' : 'Reps'}
                    value={re.reps}
                    min={1}
                    onChange={(v) => updateEx(i, { reps: v })}
                  />
                  <NumField label="Rest (s)" value={re.restSec} min={0} step={15} onChange={(v) => updateEx(i, { restSec: v })} />
                </div>
              </div>
            );
          })}

          <button className="btn block" onClick={() => setPicking(true)}>
            + Add exercise
          </button>
          <button className="btn primary block" onClick={startDay} disabled={!day.exercises.length}>
            Start {day.name}
          </button>
        </section>
      ) : (
        <p className="muted empty">Add a day to get started.</p>
      )}

      <button
        className="btn danger ghost block"
        onClick={() => {
          if (confirm(`Delete routine "${routine.name}"?`)) {
            deleteRoutine(routine.id);
            navigate('/routines');
          }
        }}
      >
        Delete routine
      </button>

      {picking && day && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(exerciseId) => {
            updateDay(day.id, (d) => ({
              ...d,
              exercises: [...d.exercises, { exerciseId, sets: 3, reps: 10, restSec: settings.defaultRestSec }],
            }));
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className="field">
      <span className="muted small">{label}</span>
      <input
        className="input"
        type="number"
        inputMode="numeric"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
      />
    </label>
  );
}
