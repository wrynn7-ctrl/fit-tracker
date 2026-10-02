import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { ROUTINE_TEMPLATES } from '../data/templates';
import { uid } from '../lib/id';
import { useStore } from '../store';

export function Routines() {
  const navigate = useNavigate();
  const routines = useStore((s) => s.routines);
  const saveRoutine = useStore((s) => s.saveRoutine);
  const [showTemplates, setShowTemplates] = useState(false);

  const createBlank = () => {
    const id = uid();
    saveRoutine({ id, name: 'New Routine', createdAt: Date.now(), days: [{ id: uid(), name: 'Day 1', exercises: [] }] });
    navigate(`/routines/${id}`);
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Routines</h1>
      </header>
      <div className="row">
        <button className="btn primary grow" onClick={createBlank}>
          + New routine
        </button>
        <button className="btn grow" onClick={() => setShowTemplates(true)}>
          From template
        </button>
      </div>

      {routines.length ? (
        <ul className="list">
          {routines.map((r) => (
            <li key={r.id}>
              <Link className="list-item card-like" to={`/routines/${r.id}`}>
                <span>
                  <strong>{r.name}</strong>
                  <span className="muted small block">
                    {r.days.length} day{r.days.length === 1 ? '' : 's'} ·{' '}
                    {r.days.reduce((n, d) => n + d.exercises.length, 0)} exercises
                  </span>
                </span>
                <span className="muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted empty">No routines yet. Build your own or start from a template.</p>
      )}

      {showTemplates && (
        <Modal title="Routine templates" onClose={() => setShowTemplates(false)}>
          <ul className="list">
            {ROUTINE_TEMPLATES.map((t) => (
              <li key={t.name}>
                <button
                  className="list-item"
                  onClick={() => {
                    const r = t.build();
                    saveRoutine(r);
                    navigate(`/routines/${r.id}`);
                  }}
                >
                  <span>
                    <strong>{t.name}</strong>
                    <span className="muted small block">{t.description}</span>
                  </span>
                  <span className="muted">+</span>
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}
