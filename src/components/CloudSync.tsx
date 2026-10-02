import { useState } from 'react';
import { supabase, syncNow, useSync } from '../sync';

const ago = (ts: number) => {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(ts).toLocaleDateString();
};

export function CloudSync() {
  const { email, status, error, lastSyncedAt, pending } = useSync();
  const pendingCount = Object.keys(pending).length;

  if (!supabase) {
    return (
      <section className="card stack">
        <h2>Cloud sync</h2>
        <p className="muted small">
          Cloud sync isn’t set up for this build. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{' '}
          (see the README), then rebuild. Until then your data stays on this device.
        </p>
      </section>
    );
  }

  if (!email) return <SignInForm />;

  const statusText =
    status === 'syncing'
      ? 'Syncing…'
      : status === 'offline'
        ? 'Offline: changes will sync when you reconnect'
        : status === 'error'
          ? `Sync failed: ${error}`
          : pendingCount
            ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting to sync`
            : lastSyncedAt
              ? `Up to date · synced ${ago(lastSyncedAt)}`
              : 'Up to date';

  return (
    <section className="card stack">
      <h2>Cloud sync</h2>
      <div>
        Signed in as <strong>{email}</strong>
        <span className={`muted small block ${status === 'error' ? 'error-text' : ''}`} role="status">
          {statusText}
        </span>
      </div>
      <button className="btn block" onClick={() => void syncNow()} disabled={status === 'syncing'}>
        Sync now
      </button>
      <button className="btn ghost block" onClick={() => void supabase!.auth.signOut()}>
        Sign out
      </button>
      <p className="muted small">Signing out keeps your data on this device.</p>
    </section>
  );
}

function SignInForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const auth = supabase!.auth;
    const { data, error } =
      mode === 'signin'
        ? await auth.signInWithPassword({ email, password })
        : await auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
    setBusy(false);
    if (error) setMessage({ text: error.message, error: true });
    else if (mode === 'signup' && !data.session)
      setMessage({ text: 'Check your email to confirm your account, then sign in here.' });
  };

  return (
    <section className="card">
      <h2>Cloud sync</h2>
      <p className="muted small">
        Sign in to back up your workouts and keep them in sync across your devices. Anything already on this device will
        be uploaded to your account.
      </p>
      <form className="stack" onSubmit={submit}>
        <input
          className="input"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder="Password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
        {message && (
          <p className={`small ${message.error ? 'error-text' : 'muted'}`} role="status">
            {message.text}
          </p>
        )}
        <button type="button" className="btn ghost block" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </section>
  );
}
