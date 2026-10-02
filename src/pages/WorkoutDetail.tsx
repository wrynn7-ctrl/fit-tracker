import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { estimate1RM, fmtDuration, fmtWeight, prsInWorkout, workoutSetCount, workoutVolume } from '../lib/calc';
import { useExerciseMap, useStore } from '../store';

export function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const workouts = useStore((s) => s.workouts);
  const units = useStore((s) => s.settings.units);
  const deleteWorkout = useStore((s) => s.deleteWorkout);
  const exMap = useExerciseMap();
  const workout = workouts.find((w) => w.id === id);
  if (!workout) return <Navigate to="/history" replace />;

  const justFinished = (location.state as { justFinished?: boolean } | null)?.justFinished;
  const prs = prsInWorkout(workouts, workout);

  return (
    <div className="page">
      <header className="page-head">
        <button className="icon-btn" onClick={() => navigate('/history')} aria-label="Back">
          ‹
        </button>
        <div className="grow">
          <h1 className="small-title">{workout.name}</h1>
          <span className="muted small">
            {new Date(workout.startedAt).toLocaleString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
      </header>

      {justFinished && (
        <div className="banner success">
          <strong>Workout complete! 💪</strong>
          {prs.length > 0 && <span className="block">You set {prs.length} new personal record(s).</span>}
        </div>
      )}

      <section className="stats">
        <div className="stat">
          <span className="stat-value">{fmtDuration(((workout.finishedAt ?? workout.startedAt) - workout.startedAt) / 1000)}</span>
          <span className="stat-label">Duration</span>
        </div>
        <div className="stat">
          <span className="stat-value">{workoutSetCount(workout)}</span>
          <span className="stat-label">Sets</span>
        </div>
        <div className="stat">
          <span className="stat-value">{fmtWeight(workoutVolume(workout), units)}</span>
          <span className="stat-label">Volume ({units})</span>
        </div>
      </section>

      {workout.exercises.map((we) => {
        const ex = exMap.get(we.exerciseId);
        const pr = prs.find((p) => p.exerciseId === we.exerciseId);
        return (
          <section key={we.id} className="card">
            <div className="row between">
              <strong>{ex?.name ?? 'Unknown exercise'}</strong>
              {pr && <span className="badge pr">PR {pr.kind === 'weight' ? 'weight' : 'est. 1RM'}</span>}
            </div>
            <ol className="set-list">
              {we.sets.map((s) => (
                <li key={s.id}>
                  {ex?.kind === 'duration'
                    ? `${s.duration}s`
                    : ex?.kind === 'reps'
                      ? `${s.reps} reps`
                      : `${fmtWeight(s.weight, units)} ${units} × ${s.reps}`}
                  {ex?.kind === 'weight_reps' && s.reps > 1 && (
                    <span className="muted small"> · e1RM {fmtWeight(estimate1RM(s.weight, s.reps), units)}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      {workout.note && (
        <section className="card">
          <h2>Notes</h2>
          <p>{workout.note}</p>
        </section>
      )}

      <button
        className="btn danger ghost block"
        onClick={() => {
          if (confirm('Delete this workout from history?')) {
            deleteWorkout(workout.id);
            navigate('/history');
          }
        }}
      >
        Delete workout
      </button>
    </div>
  );
}
