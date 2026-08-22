-- WHONEXT UNIVERSE — 月繳名單 (monthly dues roster)
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260822030000.
--
-- Backs the 球隊 > 月繳名單 admin screen: a freeform name + wallet-balance roster the admin
-- maintains by hand (not tied to profiles — entries may be people without an account). Balance is
-- edited directly (not a delta like wallet_transactions) since there's no concurrent-adjustment
-- concern here, just one admin typing a number.

create table public.monthly_dues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  balance integer not null default 0,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.monthly_dues enable row level security;

-- Admin/owner only, both ways — this is an internal admin tool, not member-facing.
create policy "admins and owners manage monthly dues" on public.monthly_dues
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'owner'))
  );
