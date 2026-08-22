-- WHONEXT UNIVERSE — persisted roster display order (管理員可拖曳排列顯示順序)
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260822030000.

alter table public.registrations add column display_order integer;

with ordered as (
  select id, row_number() over (partition by activity_id order by created_at) as rn
  from public.registrations
)
update public.registrations r
set display_order = ordered.rn
from ordered
where r.id = ordered.id;

alter table public.registrations alter column display_order set not null;
alter table public.registrations alter column display_order set default 0;

create index registrations_activity_order_idx on public.registrations (activity_id, display_order);

-- New rows (direct inserts from registerWithLine, or via the register_guest/add_guest_companion
-- RPCs which don't set display_order themselves) land at the end of that activity's roster.
create or replace function public.assign_registration_display_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.display_order is null or new.display_order = 0 then
    select coalesce(max(display_order), 0) + 1 into new.display_order
    from public.registrations
    where activity_id = new.activity_id;
  end if;
  return new;
end;
$$;

create trigger registrations_assign_display_order
  before insert on public.registrations
  for each row execute function public.assign_registration_display_order();

-- 管理員/發起人拖曳排序 — p_ids must be exactly this activity's current registration ids, in the
-- desired order. SECURITY DEFINER so the permission check happens once here rather than relying
-- on the per-row update policy/trigger for a bulk reorder.
create or replace function public.reorder_registrations(p_activity_id uuid, p_ids uuid[])
returns setof public.registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_is_organizer boolean;
  v_i int;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  select exists (
    select 1 from public.activities a where a.id = p_activity_id and a.organizer_id = auth.uid()
  ) into v_is_organizer;

  if not (v_is_organizer or v_caller_role in ('admin', 'owner')) then
    raise exception 'only the organizer or an admin/owner may reorder this roster';
  end if;

  for v_i in 1 .. coalesce(array_length(p_ids, 1), 0) loop
    update public.registrations
    set display_order = v_i
    where id = p_ids[v_i] and activity_id = p_activity_id;
  end loop;

  return query select * from public.registrations where activity_id = p_activity_id order by display_order;
end;
$$;

grant execute on function public.reorder_registrations(uuid, uuid[]) to authenticated;
