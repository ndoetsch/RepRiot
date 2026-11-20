-- Fitluck fun layer: challenges with stakes, and crew chat.
-- Points, streaks, freezes and badges are worked out from logged sets, so they need no tables.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.

-- ---------------------------------------------------------------------------
-- Challenges
--   'points'  : a competition, most points between the dates wins
--   'crew_goal': the whole crew works toward a number of sets together
-- ---------------------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  kind text not null check (kind in ('points', 'crew_goal')),
  goal int check (goal is null or goal between 1 and 100000),
  start_date date not null,
  end_date date not null,
  stakes text not null default '' check (char_length(stakes) <= 280),
  created_at timestamptz not null default now(),
  check (end_date >= start_date and end_date - start_date <= 92),
  check (kind <> 'crew_goal' or goal is not null)
);

create index challenges_crew on public.challenges (crew_id, end_date desc);

alter table public.challenges enable row level security;

create policy "members read challenges" on public.challenges
  for select using (public.is_crew_member(crew_id));
create policy "members start challenges" on public.challenges
  for insert with check (created_by = auth.uid() and public.is_crew_member(crew_id));
create policy "creator edits challenge" on public.challenges
  for update using (created_by = auth.uid());
create policy "creator deletes challenge" on public.challenges
  for delete using (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Crew chat
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 1000),
  gif_url text,
  created_at timestamptz not null default now(),
  check (char_length(trim(body)) > 0 or gif_url is not null)
);

create index messages_crew_time on public.messages (crew_id, created_at desc);

alter table public.messages enable row level security;

create policy "members read chat" on public.messages
  for select using (public.is_crew_member(crew_id));
create policy "members send chat" on public.messages
  for insert with check (user_id = auth.uid() and public.is_crew_member(crew_id));
create policy "delete own message" on public.messages
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.challenges, public.messages to authenticated;

alter publication supabase_realtime add table public.messages;
