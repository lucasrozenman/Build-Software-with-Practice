-- Run this entire file in Supabase SQL Editor.
-- Authentication is handled by Supabase Auth.
-- Each user can only see and modify their own movies.

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  year integer,
  genre text,
  status text not null default 'Want to Watch'
    check (status in ('Want to Watch', 'Watching', 'Watched')),
  rating integer
    check (rating is null or (rating >= 1 and rating <= 5)),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.movies enable row level security;

drop policy if exists "Users can view their own movies" on public.movies;
create policy "Users can view their own movies"
on public.movies for select
using (auth.uid() = user_id);

drop policy if exists "Users can add their own movies" on public.movies;
create policy "Users can add their own movies"
on public.movies for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own movies" on public.movies;
create policy "Users can update their own movies"
on public.movies for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own movies" on public.movies;
create policy "Users can delete their own movies"
on public.movies for delete
using (auth.uid() = user_id);

create index if not exists movies_user_id_idx on public.movies(user_id);
create index if not exists movies_created_at_idx on public.movies(created_at desc);