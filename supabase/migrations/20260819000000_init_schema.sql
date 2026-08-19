-- WHONEXT UNIVERSE — initial schema
-- Paste this whole file into Supabase Dashboard > SQL Editor > New query, and run it once.
-- Matches the row shapes documented in services/*/*.live.ts and types/*.ts.

create extension if not exists pgcrypto;

-- ============================================================================
-- profiles — one row per Supabase auth user, created on first LINE login
-- (see services/auth/auth.live.ts's ensureProfile()).
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  line_user_id text not null unique,
  display_name text not null,
  avatar_url text,
  role text not null default 'player' check (role in ('player', 'captain', 'admin')),
  wallet_balance integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone" on public.profiles
  for select using (true);
-- Registrant lists, organizer check-in, and the ranking page all need to read other players'
-- display name/avatar — nothing on this row is sensitive enough to restrict further.

create policy "users create their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "users update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================================
-- activity_types / sport_types — static reference data (see activities.live.ts).
-- No insert/update/delete policy: edit via the SQL editor / table editor for now.
-- ============================================================================
create table public.activity_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('competition', 'casual', 'project')),
  label_zh text not null,
  sort_order integer not null default 0
);

create table public.sport_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('badminton', 'volleyball', 'running', 'pickleball')),
  icon_key text not null,
  label_zh text not null,
  sort_order integer not null default 0
);

alter table public.activity_types enable row level security;
alter table public.sport_types enable row level security;

create policy "activity_types are viewable by everyone" on public.activity_types
  for select using (true);
create policy "sport_types are viewable by everyone" on public.sport_types
  for select using (true);

-- ============================================================================
-- activities
-- start_time/end_time are stored as 'HH:mm' text, not a time column — the app passes them
-- straight through to formatTimeRange() as opaque strings, and a native time column would come
-- back from PostgREST as 'HH:mm:ss', breaking that formatting.
-- ============================================================================
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  activity_type_id uuid not null references public.activity_types (id),
  sport_type_id uuid not null references public.sport_types (id),
  date date not null,
  start_time text not null check (start_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  end_time text check (end_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  location text not null,
  organizer_id uuid not null references public.profiles (id),
  capacity integer not null check (capacity > 0),
  status text not null default 'open' check (status in ('open', 'full', 'closed', 'cancelled')),
  poster_url text,
  created_at timestamptz not null default now()
);

create index activities_date_idx on public.activities (date);
create index activities_sport_type_idx on public.activities (sport_type_id);

alter table public.activities enable row level security;

create policy "activities are viewable by everyone" on public.activities
  for select using (true);

create policy "organizers manage their own activities" on public.activities
  for update using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
-- No insert policy yet — activities.live.ts is read-only for now (no createActivity() in the
-- app). Add one (e.g. gated to role captain/admin) once that flow is built.

-- ============================================================================
-- registrations (see services/registrations/registrations.live.ts)
-- No pin_hash is ever readable by a client role — only the SECURITY DEFINER RPCs below touch it.
-- ============================================================================
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  kind text not null check (kind in ('line', 'guest')),
  group_id uuid not null,
  profile_id uuid references public.profiles (id),
  nickname text,
  pin_hash text,
  avatar_url text,
  checked_in boolean not null default false,
  created_at timestamptz not null default now(),
  constraint registrations_kind_shape check (
    (kind = 'line' and profile_id is not null and nickname is null and pin_hash is null)
    or
    (kind = 'guest' and profile_id is null and nickname is not null and pin_hash is not null)
  )
);

create index registrations_activity_idx on public.registrations (activity_id);
create index registrations_group_idx on public.registrations (group_id);
create index registrations_profile_idx on public.registrations (profile_id);
-- A profile may only hold one LINE registration per activity (mirrors the mock's dedup check in
-- registerWithLine()).
create unique index registrations_line_unique_idx on public.registrations (activity_id, profile_id)
  where kind = 'line';

alter table public.registrations enable row level security;

create policy "registrations are viewable by everyone" on public.registrations
  for select using (true);

create policy "line registrants create their own registration" on public.registrations
  for insert with check (kind = 'line' and profile_id = auth.uid());

create policy "line registrants delete their own registration" on public.registrations
  for delete using (kind = 'line' and profile_id = auth.uid());

create policy "line registrants update their own registration" on public.registrations
  for update using (kind = 'line' and profile_id = auth.uid()) with check (kind = 'line' and profile_id = auth.uid());

create policy "organizers update check-ins for their activity" on public.registrations
  for update using (
    exists (
      select 1 from public.activities a
      where a.id = registrations.activity_id and a.organizer_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('captain', 'admin')
    )
  );

-- Postgres RLS UPDATE policies are OR'd together, so the two update policies above only gate
-- *which rows* each actor can touch, not *which columns*. This trigger closes that gap: a
-- registrant may only ever change avatar_url, and checked_in may only ever be flipped by someone
-- who passes the organizer/captain/admin check — never by the registrant themselves (that would
-- let people fake their own attendance).
create or replace function public.enforce_registration_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_organizer boolean;
begin
  select
    exists (
      select 1 from public.activities a
      where a.id = new.activity_id and a.organizer_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('captain', 'admin')
    )
    into v_is_organizer;

  if v_is_organizer then
    if new.avatar_url is distinct from old.avatar_url
       or new.nickname is distinct from old.nickname
       or new.profile_id is distinct from old.profile_id then
      raise exception 'organizers may only update checked_in';
    end if;
  else
    if new.checked_in is distinct from old.checked_in then
      raise exception 'checked_in can only be changed by the activity organizer';
    end if;
  end if;

  return new;
end;
$$;

create trigger registrations_enforce_update_scope
  before update on public.registrations
  for each row execute function public.enforce_registration_update_scope();

-- ============================================================================
-- Guest PIN registration/cancellation — SECURITY DEFINER so the client (which may not even be
-- logged in — guest flows need no LINE account) never sees or compares a pin_hash itself.
-- ============================================================================
create or replace function public.register_guest(p_activity_id uuid, p_pin text, p_nicknames text[])
returns setof public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid := gen_random_uuid();
  v_pin_hash text;
  v_nickname text;
begin
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN 必須是 4 位數字';
  end if;
  if array_length(p_nicknames, 1) is null or array_length(p_nicknames, 1) not between 1 and 4 then
    raise exception '人數需為 1 到 4 人';
  end if;

  v_pin_hash := crypt(p_pin, gen_salt('bf'));

  foreach v_nickname in array p_nicknames loop
    insert into public.registrations (activity_id, kind, group_id, nickname, pin_hash, checked_in)
    values (p_activity_id, 'guest', v_group_id, v_nickname, v_pin_hash, false);
  end loop;

  return query select * from public.registrations where group_id = v_group_id;
end;
$$;

create or replace function public.cancel_guest_registration(p_registration_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_pin_hash text;
begin
  select group_id, pin_hash into v_group_id, v_pin_hash
  from public.registrations
  where id = p_registration_id and kind = 'guest';

  if v_group_id is null then
    raise exception '找不到該筆訪客報名';
  end if;
  if v_pin_hash is null or crypt(p_pin, v_pin_hash) <> v_pin_hash then
    raise exception 'PIN 不正確';
  end if;

  delete from public.registrations where group_id = v_group_id;
end;
$$;

-- New functions need an explicit grant — unlike tables, they don't inherit Supabase's default
-- anon/authenticated privileges. Guest flows require anon: registering/cancelling never needs a
-- LINE login.
grant execute on function public.register_guest(uuid, text, text[]) to anon, authenticated;
grant execute on function public.cancel_guest_registration(uuid, text) to anon, authenticated;

-- ============================================================================
-- Optional: reference data to get the app's activity list rendering something. Run this part any
-- time after the tables above exist — it doesn't depend on any profile/activity existing yet.
-- ============================================================================
insert into public.activity_types (code, label_zh, sort_order) values
  ('competition', '賽事', 1),
  ('casual', '交流', 2),
  ('project', '企劃', 3);

insert into public.sport_types (code, icon_key, label_zh, sort_order) values
  ('badminton', 'badminton', '羽球', 1),
  ('volleyball', 'volleyball', '排球', 2),
  ('running', 'running', '路跑', 3),
  ('pickleball', 'pickleball', '匹克球', 4);

-- Optional: an example activity. This needs an organizer_id that already exists in `profiles`,
-- which only happens after someone has logged in through the app once — so run this part
-- separately, after your first live login, with your own id from:
--   select id, display_name from public.profiles;
--
-- insert into public.activities
--   (title, activity_type_id, sport_type_id, date, start_time, end_time, location, organizer_id, capacity, status)
-- select
--   'WHONEXT 羽球交流',
--   (select id from public.activity_types where code = 'casual'),
--   (select id from public.sport_types where code = 'badminton'),
--   '2026-08-28',
--   '20:00',
--   '22:00',
--   '大墩大慶羽球館 4號場',
--   '<paste-your-profile-id-here>',
--   16,
--   'open';
