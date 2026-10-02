// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const U1 = '11111111-1111-1111-1111-111111111111';
const U2 = '22222222-2222-2222-2222-222222222222';
let db: PGlite;

/** Run a query as a signed-in Supabase user (auth.uid() = uid). */
const as = (uid: string, sql: string, params: unknown[] = []) =>
  db.transaction(async (tx) => {
    await tx.exec(`set local role authenticated; select set_config('request.jwt.claim.sub', '${uid}', true);`);
    return tx.query<Record<string, unknown>>(sql, params);
  });
const push = (uid: string, items: object[]) => as(uid, 'select public.push_records($1::jsonb)', [JSON.stringify(items)]);
const rows = async (uid: string) =>
  (await as(uid, 'select collection, id, data, updated_at, deleted, rev from public.records order by rev')).rows;

beforeAll(async () => {
  db = new PGlite();
  // Minimal stand-in for the parts of Supabase the schema relies on.
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role authenticated;
    grant usage on schema auth, public to authenticated;
    grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${U1}'), ('${U2}');
  `);
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  await db.exec(schema);
  await db.exec(schema); // must be safe to re-run
});

describe('supabase schema', () => {
  it('keeps the newer write and bumps rev on every accepted change', async () => {
    await push(U1, [{ collection: 'workouts', id: 'w1', data: { name: 'v1' }, updated_at: 100, deleted: false }]);
    await push(U1, [{ collection: 'workouts', id: 'w1', data: { name: 'older' }, updated_at: 50, deleted: false }]);
    let r = await rows(U1);
    expect(r).toHaveLength(1);
    expect(r[0].data).toEqual({ name: 'v1' });
    const rev = Number(r[0].rev);

    await push(U1, [{ collection: 'workouts', id: 'w1', data: null, updated_at: 200, deleted: true }]);
    r = await rows(U1);
    expect(r[0].deleted).toBe(true);
    expect(Number(r[0].rev)).toBeGreaterThan(rev);
  });

  it('isolates users from each other', async () => {
    await push(U2, [{ collection: 'workouts', id: 'w1', data: { name: 'u2' }, updated_at: 1, deleted: false }]);
    expect((await rows(U2)).map((r) => r.data)).toEqual([{ name: 'u2' }]);
    expect(await rows(U1)).toHaveLength(1);
    await expect(
      as(U1, `insert into public.records (user_id, collection, id, updated_at) values ('${U2}', 'workouts', 'x', 1)`),
    ).rejects.toThrow(/row-level security/);
  });

  it('rejects pushes without a signed-in user', async () => {
    await expect(push('', [{ collection: 'workouts', id: 'z', data: {}, updated_at: 1, deleted: false }])).rejects.toThrow(
      /not authenticated/,
    );
  });
});
