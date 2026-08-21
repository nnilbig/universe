-- WHONEXT UNIVERSE — drop the primary-cancels-whole-group cascade
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260821010000.
--
-- cancel_guest_registration used to delete every row in the group when the cancelled row was
-- is_primary (so the accompanying-friends warning shown in the UI actually did something). Turns
-- out that warning isn't wanted — 取消主報名者 should just remove that one person like any other
-- member. is_primary stays (still used to label 主報名者 in the member list), only the cascade
-- goes away.

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
