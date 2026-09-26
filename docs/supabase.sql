-- Cloud save table for Idle Football Manager.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- One row per player; Row Level Security lets each signed-in player
-- read and write only their own save.

create table if not exists public.saves (
    user_id uuid primary key references auth.users (id) on delete cascade,
    data text not null,
    updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

create policy "Players read their own save" on public.saves
    for select using (auth.uid() = user_id);

create policy "Players create their own save" on public.saves
    for insert with check (auth.uid() = user_id);

create policy "Players update their own save" on public.saves
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Players delete their own save" on public.saves
    for delete using (auth.uid() = user_id);
