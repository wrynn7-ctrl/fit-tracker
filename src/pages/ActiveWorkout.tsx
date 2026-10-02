import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExercisePicker } from '../components/ExercisePicker';
import { NumInput } from '../components/NumInput';
import { useElapsed } from '../components/useElapsed';
import { estimate1RM, fmtWeight, fromDisplay, lastSession, toDisplay } from '../lib/calc';
import { useExerciseMap, useStore } from '../store';
import type { Exercise, SetEntry, Units, WorkoutExercise } from '../types';

export function ActiveWorkout() {
  const navigate = useNavigate();
  const active = useStore((s) => s.active);
  const workouts = useStore((s) => s.workouts);
  const units = useStore((s) => s.settings.units);
  const { addExerciseToActive, finishWorkout, discardWorkout, setActiveNote, startWorkout } = useStore();
  const exMap = useExerciseMap();
  const elapsed = useElapsed(active?.startedAt);
  const [picking, setPicking] = useState(false);

  if (!active) {
    return (
      <div className="page">
        <header className="page-head">
          <h1>Workout</h1>
        </header>
        <p className="muted empty">No workout in progress.</p>
        <button className="btn primary block" onClick={() => startWorkout()}>
          Start empty workout
        </button>
        <Link className="btn block" to="/routines">
          Choose a routine
        </Link>
      </div>
    );
  }

  const doneSets = active.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const totalSets = active.exercises.reduce((n, e) => n + e.sets.length, 0);

  const finish = () => {
    if (doneSets === 0) {
      if (confirm('No sets completed. Discard this workout?')) {
        discardWorkout();
        navigate('/');
      }
      return;
    }
    if (doneSets < totalSets && !confirm(`${totalSets - doneSets} set(s) not checked off will be dropped. Finish?`)) return;
    const w = finishWorkout();
    if (w) navigate(`/history/${w.id}`, { state: { justFinished: true } });
  };

  return (
    <div className="page">
      <header className="page-head sticky">
        <div>
          <h1 className="small-title">{active.name}</h1>
          <span className="muted small">
            {elapsed} · {doneSets}/{totalSets} sets
          </span>
        </div>
        <button className="btn primary" onClick={finish}>
          Finish
        </button>
      </header>

      {active.exercises.map((we, i) => (
        <ExerciseCard
          key={we.id}
          we={we}
          ex={exMap.get(we.exerciseId)}
          prev={lastSession(workouts, we.exerciseId, active.id)?.sets}
          units={units}
          isFirst={i === 0}
          isLast={i === active.exercises.length - 1}
        />
      ))}

      {active.exercises.length === 0 && <p className="muted empty">Add an exercise to get going.</p>}

      <button className="btn block" onClick={() => setPicking(true)}>
        + Add exercise
      </button>

      <label className="field">
        <span className="muted small">Workout notes</span>
        <textarea
          className="input"
          rows={2}
          value={active.note ?? ''}
          onChange={(e) => setActiveNote(e.target.value)}
          placeholder="How did it feel?"
        />
      </label>

      <button
        className="btn danger ghost block"
        onClick={() => {
          if (confirm('Discard this workout? Nothing will be saved.')) {
            discardWorkout();
            navigate('/');
          }
        }}
      >
        Discard workout
      </button>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(id) => {
            addExerciseToActive(id);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

function ExerciseCard({
  we,
  ex,
  prev,
  units,
  isFirst,
  isLast,
}: {
  we: WorkoutExercise;
  ex?: Exercise;
  prev?: SetEntry[];
  units: Units;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { addSet, updateSet, removeSet, toggleSetDone, removeExerciseFromActive, moveExerciseInActive } = useStore();
  const kind = ex?.kind ?? 'weight_reps';
  const best = Math.max(0, ...we.sets.filter((s) => s.done).map((s) => estimate1RM(s.weight, s.reps)));

  const prevLabel = (i: number) => {
    const p = prev?.[i];
    if (!p) return '—';
    if (kind === 'duration') return `${p.duration}s`;
    if (kind === 'reps') return `${p.reps}`;
    return `${fmtWeight(p.weight, units)}×${p.reps}`;
  };

  return (
    <section className="card">
      <div className="row between">
        <Link to={`/exercises/${we.exerciseId}`} className="ex-title">
          {ex?.name ?? 'Unknown exercise'}
        </Link>
        <span className="row tight">
          <button className="icon-btn" disabled={isFirst} onClick={() => moveExerciseInActive(we.id, -1)} aria-label="Move up">
            ↑
          </button>
          <button className="icon-btn" disabled={isLast} onClick={() => moveExerciseInActive(we.id, 1)} aria-label="Move down">
            ↓
          </button>
          <button
            className="icon-btn"
            aria-label="Remove exercise"
            onClick={() => confirm(`Remove ${ex?.name ?? 'exercise'}?`) && removeExerciseFromActive(we.id)}
          >
            ✕
          </button>
        </span>
      </div>
      {kind === 'weight_reps' && best > 0 && (
        <div className="muted small">
          Est. 1RM today: {fmtWeight(best, units)} {units}
        </div>
      )}

      <table className="sets">
        <thead>
          <tr>
            <th>Set</th>
            <th>Previous</th>
            {kind === 'weight_reps' && <th>{units}</th>}
            {kind === 'duration' ? <th>Sec</th> : <th>Reps</th>}
            <th aria-label="Done">✓</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {we.sets.map((s, i) => (
            <tr key={s.id} className={s.done ? 'done' : ''}>
              <td>{i + 1}</td>
              <td className="muted small">{prevLabel(i)}</td>
              {kind === 'weight_reps' && (
                <td>
                  <NumInput
                    className="input cell"
                    decimals
                    aria-label={`Set ${i + 1} weight`}
                    value={toDisplay(s.weight, units)}
                    onChange={(v) => updateSet(we.id, s.id, { weight: fromDisplay(v, units) })}
                  />
                </td>
              )}
              <td>
                {kind === 'duration' ? (
                  <NumInput
                    className="input cell"
                    aria-label={`Set ${i + 1} seconds`}
                    value={s.duration}
                    onChange={(v) => updateSet(we.id, s.id, { duration: v })}
                  />
                ) : (
                  <NumInput
                    className="input cell"
                    aria-label={`Set ${i + 1} reps`}
                    value={s.reps}
                    onChange={(v) => updateSet(we.id, s.id, { reps: v })}
                  />
                )}
              </td>
              <td>
                <button
                  className={`check ${s.done ? 'on' : ''}`}
                  onClick={() => toggleSetDone(we.id, s.id)}
                  aria-label={s.done ? 'Mark set not done' : 'Mark set done'}
                  aria-pressed={s.done}
                >
                  ✓
                </button>
              </td>
              <td>
                <button className="icon-btn small" onClick={() => removeSet(we.id, s.id)} aria-label="Delete set">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row between">
        <button className="btn small" onClick={() => addSet(we.id)}>
          + Add set
        </button>
        <span className="muted small">Rest {we.restSec}s</span>
      </div>
    </section>
  );
}
