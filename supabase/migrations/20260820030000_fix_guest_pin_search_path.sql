-- WHONEXT UNIVERSE — fix guest PIN functions' search_path
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260820020000.
--
-- register_guest/cancel_guest_registration (from 20260819000000) call gen_salt()/crypt() from
-- pgcrypto, but on Supabase that extension installs into the `extensions` schema, not `public`.
-- Their `set search_path = public` hid it from them, causing every 訪客報名 attempt to fail with
-- "function gen_salt(unknown) does not exist" (42883). Re-creating both with `extensions` added
-- to the path fixes it in place — no data or signature changes.

create or replace function public.register_guest(p_activity_id uuid, p_pin text, p_nicknames text[])
returns setof public.registrations
language plpgsql
security definer
set search_path = public, extensions
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
set search_path = public, extensions
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
