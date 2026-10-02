import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportData, useStore } from '../store';
import type { Units } from '../types';

export function Settings() {
  const navigate = useNavigate();
  const settings = useStore((s) => s.settings);
  const { setSettings, importData, resetAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(useStore.getState()), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fit-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.workouts)) throw new Error('Not a FitTracker backup');
      if (confirm('Replace all current data with this backup?')) importData(data);
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          ‹
        </button>
        <h1 className="grow">Settings</h1>
      </header>

      <section className="card stack">
        <label className="field">
          <span className="muted small">Weight units</span>
          <div className="chips">
            {(['lb', 'kg'] as Units[]).map((u) => (
              <button key={u} className={`chip ${settings.units === u ? 'active' : ''}`} onClick={() => setSettings({ units: u })}>
                {u}
              </button>
            ))}
          </div>
        </label>
        <label className="field">
          <span className="muted small">Default rest timer (seconds)</span>
          <input
            className="input"
            type="number"
            min={0}
            step={15}
            value={settings.defaultRestSec}
            onChange={(e) => setSettings({ defaultRestSec: Math.max(0, Number(e.target.value) || 0) })}
          />
        </label>
      </section>

      <section className="card stack">
        <h2>Data</h2>
        <p className="muted small">Your data is stored on this device only. Export a backup to move it or keep it safe.</p>
        <button className="btn block" onClick={doExport}>
          Export backup (JSON)
        </button>
        <button className="btn block" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = '';
          }}
        />
        <button
          className="btn danger ghost block"
          onClick={() => confirm('Erase ALL workouts, routines and settings? This cannot be undone.') && resetAll()}
        >
          Erase all data
        </button>
      </section>
    </div>
  );
}
