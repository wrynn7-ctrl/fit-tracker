import { describe, expect, it } from 'vitest';
import { initialData } from '../store';
import type { Workout } from '../types';
import { createSyncEngine, type PulledRecord, type Remote, type SyncState, type SyncedData } from './engine';

/** In-memory server with the same semantics as supabase/schema.sql. */
class FakeServer {
  rows = new Map<string, PulledRecord>();
  rev = 0;
  remote(): Remote {
    return {
      pull: async (since) => [...this.rows.values()].filter((r) => r.rev > since).sort((a, b) => a.rev - b.rev),
      push: async (records) => {
        for (const r of records) {
          const k = `${r.collection}:${r.id}`;
          const cur = this.rows.get(k);
          if (!cur || r.updated_at > cur.updated_at) this.rows.set(k, structuredClone({ ...r, rev: ++this.rev }));
        }
      },
    };
  }
}

const synced = (): SyncedData => {
  const { customExercises, routines, workouts, bodyLogs, settings } = initialData();
  return { customExercises, routines, workouts, bodyLogs, settings };
};

class Device {
  data = synced();
  state: SyncState = { userId: null, lastRev: 0, pending: {} };
  clock = 1000;
  engine;
  constructor(server: FakeServer) {
    this.engine = createSyncEngine({
      remote: server.remote(),
      getData: () => this.data,
      setData: (d) => (this.data = d),
      getState: () => this.state,
      setState: (s) => (this.state = s),
      now: () => this.clock,
    });
  }
  /** Mimics a store update + subscription. */
  edit(fn: (d: SyncedData) => SyncedData, at: number) {
    this.clock = at;
    const prev = this.data;
    this.data = fn(prev);
    this.engine.track(prev, this.data);
  }
}

const workout = (id: string, name = id): Workout => ({ id, name, startedAt: 1, finishedAt: 2, exercises: [] });

describe('sync engine', () => {
  it('moves data from one device to another, including deletes', async () => {
    const server = new FakeServer();
    const a = new Device(server);
    const b = new Device(server);
    a.edit((d) => ({ ...d, workouts: [workout('w1')] }), 5000); // before linking
    a.engine.link('u');
    b.engine.link('u');
    await a.engine.sync();
    await b.engine.sync();
    expect(b.data.workouts.map((w) => w.id)).toEqual(['w1']);
    expect(a.state.pending).toEqual({});

    b.edit((d) => ({ ...d, workouts: [] }), 6000);
    await b.engine.sync();
    await a.engine.sync();
    expect(a.data.workouts).toEqual([]);
  });

  it('keeps the most recent edit when both devices change the same record', async () => {
    const server = new FakeServer();
    const a = new Device(server);
    const b = new Device(server);
    a.engine.link('u');
    b.engine.link('u');
    a.edit((d) => ({ ...d, workouts: [workout('w1', 'original')] }), 2000);
    await a.engine.sync();
    await b.engine.sync();

    a.edit((d) => ({ ...d, workouts: [workout('w1', 'from A')] }), 3000);
    b.edit((d) => ({ ...d, workouts: [workout('w1', 'from B')] }), 4000); // newer
    await a.engine.sync();
    await b.engine.sync(); // B's newer pending edit survives the pull, then wins on push
    await a.engine.sync();
    expect(a.data.workouts[0].name).toBe('from B');
    expect(b.data.workouts[0].name).toBe('from B');
  });

  it('lets an existing account win over a fresh device’s default settings', async () => {
    const server = new FakeServer();
    const a = new Device(server);
    a.engine.link('u');
    a.edit((d) => ({ ...d, settings: { ...d.settings, units: 'kg' } }), 2000);
    await a.engine.sync();

    const b = new Device(server); // brand-new install, default lb
    b.engine.link('u');
    await b.engine.sync();
    expect(b.data.settings.units).toBe('kg');
    expect(server.rows.get('settings:settings')!.data).toMatchObject({ units: 'kg' });
  });

  it('merges data that existed on both devices before linking', async () => {
    const server = new FakeServer();
    const a = new Device(server);
    const b = new Device(server);
    a.edit((d) => ({ ...d, workouts: [workout('wa')] }), 2000);
    b.edit((d) => ({ ...d, workouts: [workout('wb')] }), 2000);
    a.engine.link('u');
    b.engine.link('u');
    await a.engine.sync();
    await b.engine.sync();
    await a.engine.sync();
    expect(a.data.workouts.map((w) => w.id).sort()).toEqual(['wa', 'wb']);
    expect(b.data.workouts.map((w) => w.id).sort()).toEqual(['wa', 'wb']);
  });

  it('does not re-queue records it just received', async () => {
    const server = new FakeServer();
    const a = new Device(server);
    const b = new Device(server);
    a.engine.link('u');
    b.engine.link('u');
    a.edit((d) => ({ ...d, workouts: [workout('w1')] }), 2000);
    await a.engine.sync();
    await b.engine.sync();
    expect(b.state.pending).toEqual({});
  });

  it('keeps an edit made while a push is in flight', async () => {
    const server = new FakeServer();
    const a = new Device(server);
    a.engine.link('u');
    const remote = server.remote();
    const engine = createSyncEngine({
      remote: {
        pull: remote.pull,
        push: async (r) => {
          await remote.push(r);
          a.edit((d) => ({ ...d, workouts: [workout('w1', 'edited mid-push')] }), 9000);
        },
      },
      getData: () => a.data,
      setData: (d) => (a.data = d),
      getState: () => a.state,
      setState: (s) => (a.state = s),
    });
    a.edit((d) => ({ ...d, workouts: [workout('w1')] }), 2000);
    await engine.sync();
    expect(a.state.pending['workouts:w1']).toBe(9000);
  });
});
