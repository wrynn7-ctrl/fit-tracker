import type { Settings } from '../types';
import type { AppData } from '../store';

/** List collections synced record-by-record. `settings` is synced as a single record. */
export const LIST_COLLECTIONS = ['customExercises', 'routines', 'workouts', 'bodyLogs'] as const;
type ListCollection = (typeof LIST_COLLECTIONS)[number];
export type Collection = ListCollection | 'settings';

/** The slice of app state that syncs. The in-progress workout and rest timer stay on the device. */
export type SyncedData = Pick<AppData, ListCollection | 'settings'>;

export interface SyncRecord {
  collection: Collection;
  id: string;
  data: unknown;
  updated_at: number;
  deleted: boolean;
}

export interface PulledRecord extends SyncRecord {
  rev: number;
}

export interface Remote {
  /** Records with rev > sinceRev, in rev order. */
  pull(sinceRev: number): Promise<PulledRecord[]>;
  /** Upsert; the server keeps whichever version has the newer updated_at. */
  push(records: SyncRecord[]): Promise<void>;
}

export interface SyncState {
  /** Account this device's data is linked to. Kept after sign-out so offline edits aren't lost. */
  userId: string | null;
  lastRev: number;
  /** record key -> local edit time, for changes not yet pushed. */
  pending: Record<string, number>;
}

const SETTINGS_KEY = 'settings:settings';
export const recordKey = (c: Collection, id: string) => `${c}:${id}`;
const parseKey = (k: string): [Collection, string] => {
  const i = k.indexOf(':');
  return [k.slice(0, i) as Collection, k.slice(i + 1)];
};

const list = (d: SyncedData, c: ListCollection) => d[c] as { id: string }[];

/** Every synced record in the state, keyed by record key. */
export function recordMap(d: SyncedData): Map<string, unknown> {
  const m = new Map<string, unknown>();
  for (const c of LIST_COLLECTIONS) for (const r of list(d, c)) m.set(recordKey(c, r.id), r);
  m.set(SETTINGS_KEY, d.settings);
  return m;
}

/**
 * Keys of records added, changed or removed between two states. The store updates immutably,
 * so an edited record is a new object and an untouched one keeps its reference.
 */
export function changedKeys(prev: SyncedData, next: SyncedData): string[] {
  const out: string[] = [];
  for (const c of LIST_COLLECTIONS) {
    if (prev[c] === next[c]) continue;
    const before = new Map(list(prev, c).map((r) => [r.id, r]));
    for (const r of list(next, c)) {
      if (before.get(r.id) !== r) out.push(recordKey(c, r.id));
      before.delete(r.id);
    }
    for (const id of before.keys()) out.push(recordKey(c, id));
  }
  if (prev.settings !== next.settings) out.push(SETTINGS_KEY);
  return out;
}

const sorters: Partial<Record<ListCollection, (a: never, b: never) => number>> = {
  workouts: (a: { startedAt: number }, b: { startedAt: number }) => a.startedAt - b.startedAt,
  bodyLogs: (a: { date: number }, b: { date: number }) => a.date - b.date,
  routines: (a: { createdAt: number }, b: { createdAt: number }) => a.createdAt - b.createdAt,
};

/** Applies pulled records to the state, returning new collections only where something changed. */
export function applyRemote(d: SyncedData, records: SyncRecord[]): SyncedData {
  const next: SyncedData = { ...d };
  const touched = new Map<ListCollection, Map<string, unknown>>();
  for (const r of records) {
    if (r.collection === 'settings') {
      if (!r.deleted && r.data) next.settings = { ...d.settings, ...(r.data as Partial<Settings>) };
      continue;
    }
    if (!(LIST_COLLECTIONS as readonly string[]).includes(r.collection)) continue;
    let m = touched.get(r.collection);
    if (!m) {
      m = new Map(list(d, r.collection).map((x) => [x.id, x]));
      touched.set(r.collection, m);
    }
    if (r.deleted) m.delete(r.id);
    else m.set(r.id, r.data);
  }
  for (const [c, m] of touched) {
    const items = [...m.values()] as never[];
    const sort = sorters[c];
    (next as Record<ListCollection, unknown>)[c] = sort ? items.sort(sort) : items;
  }
  return next;
}

/** Edit time used for data that existed before this device was linked: any server copy wins. */
export const SEED_STAMP = 1;
const PUSH_BATCH = 500;

export function createSyncEngine(opts: {
  remote: Remote;
  getData: () => SyncedData;
  setData: (d: SyncedData) => void;
  getState: () => SyncState;
  setState: (s: SyncState) => void;
  now?: () => number;
}) {
  const { remote, getData, setData, getState, setState, now = Date.now } = opts;
  let applyingRemote = false;

  return {
    /** Record local edits as pending. Call with every state change. */
    track(prev: SyncedData, next: SyncedData) {
      if (applyingRemote || !getState().userId) return false;
      const keys = changedKeys(prev, next);
      if (!keys.length) return false;
      const st = getState();
      const t = now();
      const pending = { ...st.pending };
      for (const k of keys) pending[k] = Math.max(t, (pending[k] ?? 0) + 1);
      setState({ ...st, pending });
      return true;
    },

    /** Link this device to an account: queue everything local for upload, starting from scratch. */
    link(userId: string) {
      const pending: Record<string, number> = {};
      for (const k of recordMap(getData()).keys()) pending[k] = SEED_STAMP;
      setState({ userId, lastRev: 0, pending });
    },

    /** One round: pull remote changes, then push local ones. */
    async sync() {
      const pulled = await remote.pull(getState().lastRev);
      if (pulled.length) {
        const st = getState();
        const pending = { ...st.pending };
        const apply: SyncRecord[] = [];
        let lastRev = st.lastRev;
        for (const r of pulled) {
          lastRev = Math.max(lastRev, r.rev);
          const k = recordKey(r.collection, r.id);
          const local = pending[k];
          if (local !== undefined && local > r.updated_at) continue; // our newer edit will be pushed
          delete pending[k];
          apply.push(r);
        }
        if (apply.length) {
          applyingRemote = true;
          try {
            setData(applyRemote(getData(), apply));
          } finally {
            applyingRemote = false;
          }
        }
        setState({ ...st, lastRev, pending });
      }

      const sent = Object.entries(getState().pending);
      if (!sent.length) return;
      const records = recordMap(getData());
      const batch: SyncRecord[] = sent.map(([k, updated_at]) => {
        const [collection, id] = parseKey(k);
        const data = records.get(k);
        return { collection, id, data: data ?? null, updated_at, deleted: data === undefined };
      });
      for (let i = 0; i < batch.length; i += PUSH_BATCH) await remote.push(batch.slice(i, i + PUSH_BATCH));

      // Clear what we sent, unless it was edited again while the push was in flight.
      const st = getState();
      const pending = { ...st.pending };
      for (const [k, t] of sent) if (pending[k] === t) delete pending[k];
      setState({ ...st, pending });
    },
  };
}

export type SyncEngine = ReturnType<typeof createSyncEngine>;
