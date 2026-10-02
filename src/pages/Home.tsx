import { Link, useNavigate } from 'react-router-dom';
import { fmtDate, fmtDuration, fmtWeight, weekStart, weekStreak, workoutSetCount, workoutVolume } from '../lib/calc';
import { useStore } from '../store';

export function Home() {
  const navigate = useNavigate();
  const { workouts, routines, active, settings, startWorkout } = useStore();
  const finished = workouts.filter((w) => w.finishedAt);
  const thisWeek = finished.filter((w) => w.startedAt >= weekStart(Date.now()));
  const weekVolume = thisWeek.reduce((a, w) => a + workoutVolume(w), 0);
  const recent = [...finished].sort((a, b) => b.startedAt - a.startedAt).slice(0, 5);

  const start = (routineId?: string, dayId?: string) => {
    if (active && !confirm('A workout is already in progress. Discard it and start a new one?')) {
      navigate('/workout');
      return;
    }
    startWorkout(routineId, dayId);
    navigate('/workout');
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>FitTracker</h1>
        <Link to="/settings" className="icon-btn" aria-label="Settings">
          ⚙
        </Link>
      </header>

      <section className="stats">
        <div className="stat">
          <span className="stat-value">{thisWeek.length}</span>
          <span className="stat-label">Workouts this week</span>
        </div>
        <div className="stat">
          <span className="stat-value">{weekStreak(workouts)}</span>
          <span className="stat-label">Week streak</span>
        </div>
        <div className="stat">
          <span className="stat-value">{fmtWeight(weekVolume, settings.units)}</span>
          <span className="stat-label">Volume ({settings.units}) this week</span>
        </div>
      </section>

      <section className="card">
        <h2>Start a workout</h2>
        {active ? (
          <button className="btn primary block" onClick={() => navigate('/workout')}>
            Resume: {active.name}
          </button>
        ) : (
          <button className="btn primary block" onClick={() => start()}>
            Quick start (empty workout)
          </button>
        )}
        {routines.map((r) => (
          <div key={r.id} className="routine-quick">
            <div className="muted small">{r.name}</div>
            <div className="row wrap">
              {r.days.map((d) => (
                <button key={d.id} className="btn" onClick={() => start(r.id, d.id)} disabled={!d.exercises.length}>
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!routines.length && (
          <p className="muted small">
            Tip: <Link to="/routines">create a routine</Link> to plan your training days.
          </p>
        )}
      </section>

      <section className="card">
        <div className="row between">
          <h2>Recent workouts</h2>
          {finished.length > 0 && <Link to="/history">See all</Link>}
        </div>
        {recent.length ? (
          <ul className="list">
            {recent.map((w) => (
              <li key={w.id}>
                <Link to={`/history/${w.id}`} className="list-item">
                  <span>
                    <strong>{w.name}</strong>
                    <span className="muted small block">{fmtDate(w.startedAt)}</span>
                  </span>
                  <span className="muted small right">
                    {workoutSetCount(w)} {workoutSetCount(w) === 1 ? 'set' : 'sets'}
                    <span className="block">{fmtDuration(((w.finishedAt ?? w.startedAt) - w.startedAt) / 1000)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted empty">No workouts logged yet. Start one above!</p>
        )}
      </section>
    </div>
  );
}
