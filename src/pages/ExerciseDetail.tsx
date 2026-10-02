import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { LineChart } from '../components/Charts';
import { exerciseHistory, fmtDate, fmtWeight, personalRecords, toDisplay } from '../lib/calc';
import { useExerciseMap, useStore } from '../store';

type Metric = 'e1rm' | 'weight' | 'volume' | 'reps';

export function ExerciseDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const ex = useExerciseMap().get(id);
  const workouts = useStore((s) => s.workouts);
  const units = useStore((s) => s.settings.units);
  const deleteCustomExercise = useStore((s) => s.deleteCustomExercise);
  const history = useMemo(() => exerciseHistory(workouts, id), [workouts, id]);
  const prs = personalRecords(history);
  const isWeighted = ex?.kind === 'weight_reps';
  const [metric, setMetric] = useState<Metric>(isWeighted ? 'e1rm' : 'reps');

  if (!ex) return <Navigate to="/exercises" replace />;

  const points = history.map((h) => ({
    x: h.date,
    y:
      metric === 'e1rm'
        ? toDisplay(h.bestE1RM, units)
        : metric === 'weight'
          ? toDisplay(h.maxWeight, units)
          : metric === 'volume'
            ? toDisplay(h.volume, units)
            : ex.kind === 'duration'
              ? Math.max(...h.sets.map((s) => s.duration))
              : h.maxReps,
  }));

  const metrics: [Metric, string][] = isWeighted
    ? [
        ['e1rm', 'Est. 1RM'],
        ['weight', 'Max weight'],
        ['volume', 'Volume'],
        ['reps', 'Max reps'],
      ]
    : [['reps', ex.kind === 'duration' ? 'Longest (s)' : 'Max reps']];

  return (
    <div className="page">
      <header className="page-head">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          ‹
        </button>
        <div className="grow">
          <h1 className="small-title">{ex.name}</h1>
          <span className="muted small">
            {ex.muscle}
            {ex.secondary?.length ? ` (+ ${ex.secondary.join(', ')})` : ''} · {ex.equipment}
          </span>
        </div>
      </header>

      {isWeighted && (
        <section className="stats">
          <div className="stat">
            <span className="stat-value">{fmtWeight(prs.bestE1RM, units)}</span>
            <span className="stat-label">Best est. 1RM ({units})</span>
          </div>
          <div className="stat">
            <span className="stat-value">{fmtWeight(prs.maxWeight, units)}</span>
            <span className="stat-label">Heaviest ({units})</span>
          </div>
          <div className="stat">
            <span className="stat-value">{prs.maxReps}</span>
            <span className="stat-label">Most reps</span>
          </div>
        </section>
      )}

      <section className="card">
        <div className="chips">
          {metrics.map(([m, label]) => (
            <button key={m} className={`chip ${metric === m ? 'active' : ''}`} onClick={() => setMetric(m)}>
              {label}
            </button>
          ))}
        </div>
        <LineChart points={points} />
      </section>

      <section className="card">
        <h2>History</h2>
        {history.length ? (
          <ul className="list">
            {[...history].reverse().map((h) => (
              <li key={h.workoutId}>
                <Link to={`/history/${h.workoutId}`} className="list-item">
                  <span>
                    <strong>{fmtDate(h.date)}</strong>
                    <span className="muted small block">
                      {h.sets
                        .map((s) =>
                          ex.kind === 'duration'
                            ? `${s.duration}s`
                            : ex.kind === 'reps'
                              ? `${s.reps}`
                              : `${fmtWeight(s.weight, units)}×${s.reps}`,
                        )
                        .join(', ')}
                    </span>
                  </span>
                  {isWeighted && <span className="muted small">1RM {fmtWeight(h.bestE1RM, units)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted empty">You haven't logged this exercise yet.</p>
        )}
      </section>

      {ex.custom && (
        <button
          className="btn danger ghost block"
          onClick={() => {
            if (confirm(`Delete custom exercise "${ex.name}"? Logged history stays but will show as unknown.`)) {
              deleteCustomExercise(ex.id);
              navigate('/exercises');
            }
          }}
        >
          Delete custom exercise
        </button>
      )}
    </div>
  );
}
