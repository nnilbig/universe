-- WHONEXT UNIVERSE — let admin/owner manage (e.g. close) ANY activity, not just their own
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260822020000.
--
-- 20260820000000_role_permissions.sql already gave admin/owner check-in and registrant
-- add/remove powers on any activity, but left this update policy organizer-only — the UI now
-- also lets an admin/owner open and manage another organizer's activity (see
-- ActivityDetailSheet.vue's isOwnActivityEditMode), so the policy needs to match.

drop policy "organizers manage their own activities" on public.activities;
create policy "organizers manage their own activities" on public.activities
  for update using (
    organizer_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner'))
  )
  with check (
    organizer_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner'))
  );
