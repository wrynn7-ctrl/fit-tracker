import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStore, type AppData } from '../store';
import { createSyncEngine, type PulledRecord, type Remote, type SyncedData, type SyncState } from './engine';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncStore extends SyncState {
  email: string | null;
  status: SyncStatus;
  error: string | null;
  lastSyncedAt: number | null;
}

/** Sync bookkeeping, persisted separately from app data so it never ends up in backups. */
export const useSync = create<SyncStore>()(
  persist(
    (): SyncStore => ({
      userId: null,
      lastRev: 0,
      pending: {},
      email: null,
      status: 'idle',
      error: null,
      lastSyncedAt: null,
    }),
    {
      name: 'fit-tracker-sync',
      partialize: ({ userId, lastRev, pending, lastSyncedAt }) => ({ userId, lastRev, pending, lastSyncedAt }),
    },
  ),
);

const PAGE = 1000;

const supabaseRemote = (client: SupabaseClient): Remote => ({
  async pull(sinceRev) {
    const out: PulledRecord[] = [];
    let cursor = sinceRev;
    for (;;) {
      const { data, error } = await client
        .from('records')
        .select('collection, id, data, updated_at, deleted, rev')
        .gt('rev', cursor)
        .order('rev')
        .limit(PAGE);
      if (error) throw error;
      const page = data.map((r) => ({ ...r, rev: Number(r.rev), updated_at: Number(r.updated_at) })) as PulledRecord[];
      out.push(...page);
      if (page.length < PAGE) return out;
      cursor = page[page.length - 1].rev;
    }
  },
  async push(records) {
    const { error } = await client.rpc('push_records', { items: records });
    if (error) throw error;
  },
});

const pickSynced = (s: AppData): SyncedData => ({
  customExercises: s.customExercises,
  routines: s.routines,
  workouts: s.workouts,
  bodyLogs: s.bodyLogs,
  settings: s.settings,
});

let signedIn = false;
let running = false;
let rerun = false;
let timer: ReturnType<typeof setTimeout> | undefined;

const engine = supabase
  ? createSyncEngine({
      remote: supabaseRemote(supabase),
      getData: () => pickSynced(useStore.getState()),
      setData: (d) => useStore.setState(d),
      getState: () => {
        const { userId, lastRev, pending } = useSync.getState();
        return { userId, lastRev, pending };
      },
      setState: (s) => useSync.setState(s),
    })
  : null;

async function runSync() {
  if (!engine || !signedIn) return;
  if (running) {
    rerun = true;
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    useSync.setState({ status: 'offline' });
    return;
  }
  running = true;
  useSync.setState({ status: 'syncing', error: null });
  try {
    await engine.sync();
    useSync.setState({ status: 'idle', lastSyncedAt: Date.now() });
  } catch (e) {
    useSync.setState({ status: 'error', error: e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e) });
  } finally {
    running = false;
    if (rerun) {
      rerun = false;
      scheduleSync(0);
    }
  }
}

export function scheduleSync(delayMs = 1500) {
  clearTimeout(timer);
  timer = setTimeout(() => void runSync(), delayMs);
}

export const syncNow = () => runSync();

let started = false;

/** Wires up change tracking, auth, and background sync triggers. Safe to call once at startup. */
export function startSync() {
  if (!supabase || !engine || started) return;
  started = true;

  useStore.subscribe((next, prev) => {
    if (engine.track(pickSynced(prev), pickSynced(next))) scheduleSync();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    signedIn = !!user;
    useSync.setState({ email: user?.email ?? null });
    if (!user) return;
    // A different account than this device was linked to: upload everything local to it.
    if (useSync.getState().userId !== user.id) engine.link(user.id);
    // Defer: Supabase recommends not awaiting other client calls inside this callback.
    scheduleSync(0);
  });

  window.addEventListener('online', () => scheduleSync(0));
  window.addEventListener('offline', () => useSync.setState({ status: 'offline' }));
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && scheduleSync(0));
  setInterval(() => scheduleSync(0), 60_000);
}
