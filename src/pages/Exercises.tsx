import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MuscleChips } from '../components/ExercisePicker';
import { Modal } from '../components/Modal';
import { EQUIPMENT, MUSCLE_GROUPS } from '../data/exercises';
import { useExercises, useStore } from '../store';
import type { Equipment, ExerciseKind, MuscleGroup } from '../types';

export function Exercises() {
  const exercises = useExercises();
  const workouts = useStore((s) => s.workouts);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'All'>('All');
  const [creating, setCreating] = useState(false);

  const timesDone = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of workouts) for (const e of w.exercises) m.set(e.exerciseId, (m.get(e.exerciseId) ?? 0) + 1);
    return m;
  }, [workouts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises
      .filter((e) => (muscle === 'All' || e.muscle === muscle) && (!q || e.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, query, muscle]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Exercises</h1>
        <button className="btn small" onClick={() => setCreating(true)}>
          + Custom
        </button>
      </header>
      <input className="input" placeholder="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} />
      <MuscleChips value={muscle} onChange={setMuscle} />
      <ul className="list">
        {filtered.map((e) => (
          <li key={e.id}>
            <Link to={`/exercises/${e.id}`} className="list-item">
              <span>
                {e.name}
                {e.custom && <span className="badge">custom</span>}
                <span className="muted small block">
                  {e.muscle} · {e.equipment}
                </span>
              </span>
              {timesDone.get(e.id) ? <span className="muted small">{timesDone.get(e.id)}×</span> : null}
            </Link>
          </li>
        ))}
        {!filtered.length && <li className="muted empty">No exercises match.</li>}
      </ul>
      {creating && <CustomExerciseForm onClose={() => setCreating(false)} />}
    </div>
  );
}

function CustomExerciseForm({ onClose }: { onClose: () => void }) {
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>('Chest');
  const [equipment, setEquipment] = useState<Equipment>('Barbell');
  const [kind, setKind] = useState<ExerciseKind>('weight_reps');

  return (
    <Modal title="Custom exercise" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addCustomExercise({ name: name.trim(), muscle, equipment, kind });
          onClose();
        }}
      >
        <label className="field">
          <span className="muted small">Name</span>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          <span className="muted small">Primary muscle</span>
          <select className="input" value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleGroup)}>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="muted small">Equipment</span>
          <select className="input" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
            {EQUIPMENT.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="muted small">Tracking</span>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as ExerciseKind)}>
            <option value="weight_reps">Weight & reps</option>
            <option value="reps">Reps only</option>
            <option value="duration">Duration</option>
          </select>
        </label>
        <button className="btn primary block" type="submit">
          Save exercise
        </button>
      </form>
    </Modal>
  );
}
