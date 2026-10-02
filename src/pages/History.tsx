import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fmtDuration, fmtWeight, workoutSetCount, workoutVolume } from '../lib/calc';
import { useStore } from '../store';
import type { Workout } from '../types';

export function History() {
  const workouts = useStore((s) => s.workouts);
  const units = useStore((s) => s.settings.units);

  const byMonth = useMemo(() => {
    const groups = new Map<string, Workout[]>();
    for (const w of [...workouts].sort((a, b) => b.startedAt - a.startedAt)) {
      const key = new Date(w.startedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      groups.set(key, [...(groups.get(key) ?? []), w]);
    }
    return [...groups];
  }, [workouts]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>History</h1>
        <span className="muted small">{workouts.length} workouts</span>
      </header>
      <CalendarStrip workouts={workouts} />
      {byMonth.map(([month, list]) => (
        <section key={month}>
          <h2 className="section-title">{month}</h2>
          <ul className="list">
            {list.map((w) => (
              <li key={w.id}>
                <Link to={`/history/${w.id}`} className="list-item card-like">
                  <span>
                    <strong>{w.name}</strong>
                    <span className="muted small block">
                      {new Date(w.startedAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })} ·{' '}
                      {fmtDuration(((w.finishedAt ?? w.startedAt) - w.startedAt) / 1000)} · {w.exercises.length} exercises
                    </span>
                  </span>
                  <span className="muted small right">
                    {workoutSetCount(w)} {workoutSetCount(w) === 1 ? 'set' : 'sets'}
                    <span className="block">
                      {fmtWeight(workoutVolume(w), units)} {units}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!workouts.length && <p className="muted empty">Finished workouts will show up here.</p>}
    </div>
  );
}

/** Last 5 weeks as a GitHub-style grid of trained days. */
function CalendarStrip({ workouts }: { workouts: Workout[] }) {
  const trained = new Set(workouts.map((w) => new Date(w.startedAt).toDateString()));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 28);
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  return (
    <div className="calendar" aria-label="Training calendar, last 5 weeks">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
        <span key={i} className="cal-head">
          {d}
        </span>
      ))}
      {days.map((d) => (
        <span
          key={d.getTime()}
          title={d.toDateString()}
          className={`cal-day ${trained.has(d.toDateString()) ? 'on' : ''} ${d > today ? 'future' : ''} ${
            d.getTime() === today.getTime() ? 'today' : ''
          }`}
        >
          {d.getDate()}
        </span>
      ))}
    </div>
  );
}
