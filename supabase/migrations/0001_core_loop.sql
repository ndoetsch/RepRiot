-- RepRiot (from Fitluck) core loop schema.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

-- ---------------------------------------------------------------------------
-- Profiles: one row per signed-in person, created automatically at sign-up.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  bio_public boolean not null default true,
  goals text[] not null default '{}',
  goals_public boolean not null default false,
  gif_themes text[] not null default '{}',
  avatar_url text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Crews and members. A crew holds at most 5 people; a person can join many.
-- ---------------------------------------------------------------------------
create table public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique default lower(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.crew_members (
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);

create or replace function public.is_crew_member(p_crew uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.crew_members
    where crew_id = p_crew and user_id = auth.uid()
  );
$$;

-- Do two people share a crew? Used so crewmates can see each other's profiles.
create or replace function public.shares_crew_with(p_user uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.crew_members a
    join public.crew_members b on a.crew_id = b.crew_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

create or replace function public.enforce_crew_cap()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.crew_members where crew_id = new.crew_id) >= 5 then
    raise exception 'This crew is full (5 people max).';
  end if;
  return new;
end;
$$;

create trigger crew_cap
  before insert on public.crew_members
  for each row execute function public.enforce_crew_cap();

-- Create a crew and join it in one step.
create or replace function public.create_crew(p_name text)
returns public.crews
language plpgsql
security definer set search_path = public
as $$
declare
  c public.crews;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  insert into public.crews (name, created_by) values (trim(p_name), auth.uid()) returning * into c;
  insert into public.crew_members (crew_id, user_id) values (c.id, auth.uid());
  return c;
end;
$$;

-- Look up a crew from an invite code without being a member yet.
create or replace function public.crew_preview(p_code text)
returns table (id uuid, name text, member_count bigint, member_names text[])
language sql
stable
security definer set search_path = public
as $$
  select c.id, c.name, count(m.user_id),
         coalesce(array_agg(p.display_name) filter (where p.id is not null), '{}')
  from public.crews c
  left join public.crew_members m on m.crew_id = c.id
  left join public.profiles p on p.id = m.user_id
  where c.invite_code = lower(trim(p_code))
  group by c.id, c.name;
$$;

create or replace function public.join_crew(p_code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_crew uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  select id into v_crew from public.crews where invite_code = lower(trim(p_code));
  if v_crew is null then
    raise exception 'That invite link is not valid.';
  end if;
  if exists (select 1 from public.crew_members where crew_id = v_crew and user_id = auth.uid()) then
    return v_crew;
  end if;
  insert into public.crew_members (crew_id, user_id)
  values (v_crew, auth.uid())
  on conflict do nothing;
  return v_crew;
end;
$$;

-- ---------------------------------------------------------------------------
-- Potluck exercises: each member brings one per crew.
-- Every set is 1 minute or less; the GIF or clip is required.
-- ---------------------------------------------------------------------------
create table public.potluck_exercises (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  mode text not null check (mode in ('reps', 'seconds')),
  amount int not null check (amount > 0 and (mode = 'reps' and amount <= 60 or mode = 'seconds' and amount <= 60)),
  tutorial text not null default '',
  modifier text not null default '',
  media_type text not null check (media_type in ('giphy', 'upload')),
  media_url text not null,
  media_still_url text,
  media_title text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index one_active_exercise_per_member
  on public.potluck_exercises (crew_id, user_id) where active;

-- ---------------------------------------------------------------------------
-- Logged sets: at most 3 per person, per exercise, per day.
-- local_date is the day in the person's own time zone.
-- ---------------------------------------------------------------------------
create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  exercise_id uuid not null references public.potluck_exercises (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  quick_log boolean not null default false,
  logged_at timestamptz not null default now()
);

create index set_logs_crew_time on public.set_logs (crew_id, logged_at desc);
create index set_logs_user_day on public.set_logs (user_id, exercise_id, local_date);

create or replace function public.enforce_three_sets()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.set_logs
      where user_id = new.user_id and exercise_id = new.exercise_id and local_date = new.local_date) >= 3 then
    raise exception 'All 3 sets of this one are already done today.';
  end if;
  return new;
end;
$$;

create trigger three_sets_a_day
  before insert on public.set_logs
  for each row execute function public.enforce_three_sets();

-- ---------------------------------------------------------------------------
-- Reactions on logged sets.
-- ---------------------------------------------------------------------------
create table public.reactions (
  log_id uuid not null references public.set_logs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '💪', '😂', '👏')),
  created_at timestamptz not null default now(),
  primary key (log_id, user_id, emoji)
);

-- ---------------------------------------------------------------------------
-- Row level security: you only see crews you belong to.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.potluck_exercises enable row level security;
alter table public.set_logs enable row level security;
alter table public.reactions enable row level security;

create policy "read own or crewmate profiles" on public.profiles
  for select using (id = auth.uid() or public.shares_crew_with(id));
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "members read crew" on public.crews
  for select using (public.is_crew_member(id));
create policy "creator renames crew" on public.crews
  for update using (created_by = auth.uid());

create policy "members read members" on public.crew_members
  for select using (public.is_crew_member(crew_id));
create policy "leave crew" on public.crew_members
  for delete using (user_id = auth.uid());

create policy "members read exercises" on public.potluck_exercises
  for select using (public.is_crew_member(crew_id));
create policy "bring own exercise" on public.potluck_exercises
  for insert with check (user_id = auth.uid() and public.is_crew_member(crew_id));
create policy "edit own exercise" on public.potluck_exercises
  for update using (user_id = auth.uid());

create policy "members read logs" on public.set_logs
  for select using (public.is_crew_member(crew_id));
create policy "log own sets" on public.set_logs
  for insert with check (
    user_id = auth.uid()
    and public.is_crew_member(crew_id)
    and exists (select 1 from public.potluck_exercises e where e.id = exercise_id and e.crew_id = set_logs.crew_id and e.active)
  );
create policy "undo own sets" on public.set_logs
  for delete using (user_id = auth.uid());

create policy "members read reactions" on public.reactions
  for select using (exists (select 1 from public.set_logs l where l.id = log_id and public.is_crew_member(l.crew_id)));
create policy "react" on public.reactions
  for insert with check (user_id = auth.uid() and exists (select 1 from public.set_logs l where l.id = log_id and public.is_crew_member(l.crew_id)));
create policy "unreact" on public.reactions
  for delete using (user_id = auth.uid());

-- Table access for signed-in people. Row level security above decides which rows.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles, public.crews, public.crew_members, public.potluck_exercises, public.set_logs, public.reactions
  to authenticated;
grant execute on function
  public.create_crew(text), public.crew_preview(text), public.join_crew(text),
  public.is_crew_member(uuid), public.shares_crew_with(uuid)
  to authenticated;

-- Live updates for the feed.
alter publication supabase_realtime add table public.set_logs, public.reactions;

-- ---------------------------------------------------------------------------
-- Storage for people's own short clips (public to read, upload to your own folder).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clips', 'clips', true, 20971520, array['video/mp4', 'video/quicktime', 'video/webm', 'image/gif'])
on conflict (id) do nothing;

create policy "upload own clips" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'clips' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read clips" on storage.objects
  for select using (bucket_id = 'clips');
