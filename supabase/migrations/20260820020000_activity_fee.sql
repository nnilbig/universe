-- WHONEXT UNIVERSE — activity fee
-- Paste into Supabase Dashboard > SQL Editor > New query, run once after 20260820010000.
--
-- Backs the 費用 field on the admin "create activity" form. Not wired to automatic wallet
-- deduction yet (registrations.live.ts doesn't charge on registration) — this just stores it.

alter table public.activities add column fee integer not null default 0 check (fee >= 0);
