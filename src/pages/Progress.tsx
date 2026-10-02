import { useMemo, useState } from 'react';
import { BarChart, LineChart } from '../components/Charts';
import { NumInput } from '../components/NumInput';
import { MUSCLE_GROUPS } from '../data/exercises';
import { completedSets, fmtDate, fmtWeight, fromDisplay, toDisplay, weekStart, workoutVolume } from '../lib/calc';
import { useExerciseMap, useStore } from '../store';

const DAY = 86_400_000;

export function Progress() {
  const workouts = useStore((s) => s.workouts);
  const bodyLogs = useStore((s) => s.bodyLogs);
  const units = useStore((s) => s.settings.units);
  const { addBodyLog, deleteBodyLog } = useStore();
  const exMap = useExerciseMap();
  const [weight, setWeight] = useState(0);
  const [bodyFat, setBodyFat] = useState(0);

  const weekly = useMemo(() => {
    const thisWeek = weekStart(Date.now());
    const weeks = Array.from({ length: 8 }, (_, i) => weekStart(thisWeek - (7 - i) * 7 * DAY + DAY));
    return weeks.map((ws) => {
      const inWeek = workouts.filter((w) => weekStart(w.startedAt) === ws);
      return {
        label: new Date(ws).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        volume: inWeek.reduce((a, w) => a + workoutVolume(w), 0),
        count: inWeek.length,
      };
    });
  }, [workouts]);

  const muscleSets = useMemo(() => {
    const since = Date.now() - 30 * DAY;
    const counts = new Map<string, number>();
    for (const w of workouts.filter((w) => w.startedAt >= since))
      for (const we of w.exercises) {
        const m = exMap.get(we.exerciseId)?.muscle;
        if (m) counts.set(m, (counts.get(m) ?? 0) + completedSets(we).length);
      }
    return MUSCLE_GROUPS.map((m) => ({ muscle: m, sets: counts.get(m) ?? 0 })).filter((m) => m.sets > 0);
  }, [workouts, exMap]);
  const maxMuscle = Math.max(1, ...muscleSets.map((m) => m.sets));

  const weightPoints = bodyLogs.filter((b) => b.weight).map((b) => ({ x: b.date, y: toDisplay(b.weight!, units) }));

  return (
    <div className="page">
      <header className="page-head">
        <h1>Progress</h1>
      </header>

      <section className="card">
        <h2>Weekly volume ({units})</h2>
        <BarChart
          bars={weekly.map((w) => ({ label: w.label, value: toDisplay(w.volume, units) }))}
          format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0))}
        />
      </section>

      <section className="card">
        <h2>Workouts per week</h2>
        <BarChart bars={weekly.map((w) => ({ label: w.label, value: w.count }))} />
      </section>

      <section className="card">
        <h2>Sets per muscle (last 30 days)</h2>
        {muscleSets.length ? (
          <ul className="meter-list">
            {muscleSets.map((m) => (
              <li key={m.muscle}>
                <span className="meter-label">{m.muscle}</span>
                <span className="meter">
                  <span className="meter-fill" style={{ width: `${(m.sets / maxMuscle) * 100}%` }} />
                </span>
                <span className="meter-value">{m.sets}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted empty">No sets logged in the last 30 days.</p>
        )}
      </section>

      <section className="card">
        <h2>Body weight ({units})</h2>
        <LineChart points={weightPoints} format={(v) => v.toFixed(1)} />
        <form
          className="row fields"
          onSubmit={(e) => {
            e.preventDefault();
            if (!weight && !bodyFat) return;
            addBodyLog({
              date: Date.now(),
              weight: weight ? fromDisplay(weight, units) : undefined,
              bodyFat: bodyFat || undefined,
            });
            setWeight(0);
            setBodyFat(0);
          }}
        >
          <label className="field">
            <span className="muted small">Weight ({units})</span>
            <NumInput className="input" decimals value={weight} onChange={setWeight} />
          </label>
          <label className="field">
            <span className="muted small">Body fat %</span>
            <NumInput className="input" decimals value={bodyFat} onChange={setBodyFat} />
          </label>
          <button className="btn primary" type="submit">
            Log
          </button>
        </form>
        <ul className="list">
          {[...bodyLogs]
            .reverse()
            .slice(0, 10)
            .map((b) => (
              <li key={b.id} className="list-item">
                <span>{fmtDate(b.date)}</span>
                <span className="row tight">
                  {b.weight ? `${fmtWeight(b.weight, units)} ${units}` : ''}
                  {b.bodyFat ? ` · ${b.bodyFat}%` : ''}
                  <button className="icon-btn small" onClick={() => deleteBodyLog(b.id)} aria-label="Delete entry">
                    ✕
                  </button>
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
