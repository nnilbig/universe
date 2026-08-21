-- WHONEXT UNIVERSE — drop PIN requirement from guest registration (MVP: 免 PIN 碼極速報名)
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260820030000.
--
-- MVP guest flow drops PIN verification entirely to lower the first-registration barrier: guests
-- register with just a nickname, and the client asserts "this is my registration" via a
-- localStorage list of nicknames it has used (see composables/useGuestNames.ts) instead of a PIN.
-- cancel_guest_registration still checks the submitted nickname against the row's actual nickname
-- as a sanity check, but this is NOT real authentication — registrations are publicly readable
-- (see "registrations are viewable by everyone" below), so a determined caller could still invoke
-- this RPC directly with a guessed/observed id+nickname pair. Accepted trade-off for MVP; revisit
-- if abuse shows up. Also switches guest cancellation from whole-group to single-registration, now
-- that each member has their own distinct nickname instead of a PIN shared across the group.

alter table public.registrations drop constraint registrations_kind_shape;
alter table public.registrations add constraint registrations_kind_shape check (
  (kind = 'line' and profile_id is not null and nickname is null)
  or
  (kind = 'guest' and profile_id is null and nickname is not null)
);

drop function if exists public.register_guest(uuid, text, text[]);
drop function if exists public.cancel_guest_registration(uuid, text);

create or replace function public.register_guest(p_activity_id uuid, p_nicknames text[])
returns setof public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid := gen_random_uuid();
  v_nickname text;
begin
  if array_length(p_nicknames, 1) is null or array_length(p_nicknames, 1) not between 1 and 4 then
    raise exception '人數需為 1 到 4 人';
  end if;

  foreach v_nickname in array p_nicknames loop
    insert into public.registrations (activity_id, kind, group_id, nickname, checked_in)
    values (p_activity_id, 'guest', v_group_id, v_nickname, false);
  end loop;

  return query select * from public.registrations where group_id = v_group_id;
end;
$$;

create or replace function public.cancel_guest_registration(p_registration_id uuid, p_nickname text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
begin
  select nickname into v_nickname
  from public.registrations
  where id = p_registration_id and kind = 'guest';

  if v_nickname is null then
    raise exception '找不到該筆訪客報名';
  end if;
  if v_nickname is distinct from p_nickname then
    raise exception '暱稱不符';
  end if;

  delete from public.registrations where id = p_registration_id;
end;
$$;

grant execute on function public.register_guest(uuid, text[]) to anon, authenticated;
grant execute on function public.cancel_guest_registration(uuid, text) to anon, authenticated;
