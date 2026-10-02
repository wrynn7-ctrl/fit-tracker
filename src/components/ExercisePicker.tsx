import { useMemo, useState } from 'react';
import { MUSCLE_GROUPS } from '../data/exercises';
import { useExercises } from '../store';
import type { MuscleGroup } from '../types';
import { Modal } from './Modal';

export function ExercisePicker({
  onPick,
  onClose,
  title = 'Add exercise',
}: {
  onPick: (exerciseId: string) => void;
  onClose: () => void;
  title?: string;
}) {
  const exercises = useExercises();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'All'>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises
      .filter((e) => (muscle === 'All' || e.muscle === muscle) && (!q || e.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, query, muscle]);

  return (
    <Modal title={title} onClose={onClose}>
      <input
        className="input"
        autoFocus
        placeholder="Search exercises"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <MuscleChips value={muscle} onChange={setMuscle} />
      <ul className="list">
        {filtered.map((e) => (
          <li key={e.id}>
            <button className="list-item" onClick={() => onPick(e.id)}>
              <span>{e.name}</span>
              <span className="muted small">
                {e.muscle} · {e.equipment}
              </span>
            </button>
          </li>
        ))}
        {!filtered.length && <li className="muted empty">No exercises match.</li>}
      </ul>
    </Modal>
  );
}

export function MuscleChips({
  value,
  onChange,
}: {
  value: MuscleGroup | 'All';
  onChange: (m: MuscleGroup | 'All') => void;
}) {
  return (
    <div className="chips">
      {(['All', ...MUSCLE_GROUPS] as const).map((m) => (
        <button key={m} className={`chip ${value === m ? 'active' : ''}`} onClick={() => onChange(m)}>
          {m}
        </button>
      ))}
    </div>
  );
}
