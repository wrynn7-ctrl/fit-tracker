-- FitTracker cloud sync schema. Run once in the Supabase SQL editor.
--
-- Every synced item (workout, routine, custom exercise, body log, settings) is one row.
-- Deletes are kept as tombstones so other devices learn about them.
-- `updated_at` is the client's edit time (last write wins);
-- `rev` is a server-assigned, ever-increasing number that clients use to pull "everything since".

create sequence if not exists public.records_rev_seq;

create table if not exists public.records (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  collection text not null,
  id text not null,
  data jsonb,
  updated_at bigint not null,
  deleted boolean not null default false,
  rev bigint not null default nextval('public.records_rev_seq'),
  primary key (user_id, collection, id)
);

create index if not exists records_user_rev_idx on public.records (user_id, rev);

alter table public.records enable row level security;

drop policy if exists "records_select_own" on public.records;
create policy "records_select_own" on public.records
  for select using (auth.uid() = user_id);

drop policy if exists "records_insert_own" on public.records;
create policy "records_insert_own" on public.records
  for insert with check (auth.uid() = user_id);

drop policy if exists "records_update_own" on public.records;
create policy "records_update_own" on public.records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.records to authenticated;
grant usage on sequence public.records_rev_seq to authenticated;

-- Upserts a batch of records, keeping whichever version has the newer updated_at.
create or replace function public.push_records(items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.records (user_id, collection, id, data, updated_at, deleted, rev)
  select auth.uid(), r.collection, r.id, r.data, r.updated_at, coalesce(r.deleted, false),
         nextval('public.records_rev_seq')
  from jsonb_to_recordset(items) as r(collection text, id text, data jsonb, updated_at bigint, deleted boolean)
  on conflict (user_id, collection, id) do update
    set data = excluded.data,
        updated_at = excluded.updated_at,
        deleted = excluded.deleted,
        rev = excluded.rev
    where excluded.updated_at > public.records.updated_at;
end;
$$;

grant execute on function public.push_records(jsonb) to authenticated;
