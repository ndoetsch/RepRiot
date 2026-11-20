-- RepRascal: solo play, squads of up to 8, public squads up to 20,
-- gauntlets the squad debates and votes on, and open dares people opt into.
-- Run once in the Supabase dashboard (SQL Editor > New query > paste > Run), after 0001 to 0004.

-- ---------------------------------------------------------------------------
-- Squad settings
--   solo        : just you, and you can bring up to 5 moves
--   is_public   : anyone can find and join it (organizer's choice; private by default)
--   max_members : the organizer's cap. Private squads go up to 8, public ones up to 20.
-- ---------------------------------------------------------------------------
alter table public.crews
  add column solo boolean not null default false,
  add column is_public boolean not null default false,
  add column max_members int not null default 8,
  add column description text not null default '' check (char_length(description) <= 200);

alter table public.crews add constraint crew_size_rules check (
  (solo and max_members = 1 and not is_public)
  or (not solo and not is_public and max_members between 2 and 8)
  or (not solo and is_public and max_members between 2 and 20)
);

create or replace function public.enforce_crew_cap()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_max int;
begin
  select max_members into v_max from public.crews where id = new.crew_id for update;
  if (select count(*) from public.crew_members where crew_id = new.crew_id) >= v_max then
    raise exception 'This squad is full (% max).', v_max;
  end if;
  return new;
end;
$$;

-- Organizers can't shrink a squad below the people already in it, or turn a solo run into a squad.
create or replace function public.check_crew_settings()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.solo <> old.solo then
    raise exception 'A solo run can''t become a squad. Start a new squad instead.';
  end if;
  if not new.solo and not new.is_public and new.max_members > 8 then
    raise exception 'Private squads can have up to 8 people. Lower the cap first, or keep it public.';
  end if;
  if not new.solo and new.is_public and new.max_members > 20 then
    raise exception 'Public squads can have up to 20 people.';
  end if;
  if new.max_members < (select count(*) from public.crew_members where crew_id = new.id) then
    raise exception 'The squad already has more people than that.';
  end if;
  return new;
end;
$$;

create trigger crew_settings
  before update on public.crews
  for each row execute function public.check_crew_settings();

-- Replaces create_crew(text) from 0001.
create or replace function public.create_squad(p_name text, p_solo boolean, p_public boolean, p_max int, p_description text default '')
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
  if not p_solo and not p_public and p_max not between 2 and 8 then
    raise exception 'Private squads can have 2 to 8 people.';
  end if;
  if not p_solo and p_public and p_max not between 2 and 20 then
    raise exception 'Public squads can have 2 to 20 people.';
  end if;
  insert into public.crews (name, created_by, solo, is_public, max_members, description)
  values (trim(p_name), auth.uid(), p_solo, p_public and not p_solo, case when p_solo then 1 else p_max end, trim(coalesce(p_description, '')))
  returning * into c;
  insert into public.crew_members (crew_id, user_id) values (c.id, auth.uid());
  return c;
end;
$$;

-- Anyone signed in can see public squads, so they can find one to join.
create policy "anyone reads public crews" on public.crews
  for select using (is_public);

create or replace function public.public_squads()
returns table (id uuid, name text, description text, member_count bigint, max_members int)
language sql
stable
security definer set search_path = public
as $$
  select c.id, c.name, c.description, count(m.user_id), c.max_members
  from public.crews c
  left join public.crew_members m on m.crew_id = c.id
  where c.is_public
  group by c.id
  order by count(m.user_id) desc, c.created_at desc
  limit 100;
$$;

create or replace function public.join_public_squad(p_crew uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if not exists (select 1 from public.crews where id = p_crew and is_public) then
    raise exception 'That squad is private. Ask for an invite link.';
  end if;
  insert into public.crew_members (crew_id, user_id) values (p_crew, auth.uid()) on conflict do nothing;
  return p_crew;
end;
$$;

-- Invite previews now show the cap.
drop function if exists public.crew_preview(text);
create or replace function public.crew_preview(p_code text)
returns table (id uuid, name text, member_count bigint, member_names text[], max_members int)
language sql
stable
security definer set search_path = public
as $$
  select c.id, c.name, count(m.user_id),
         coalesce(array_agg(p.display_name) filter (where p.id is not null), '{}'),
         c.max_members
  from public.crews c
  left join public.crew_members m on m.crew_id = c.id
  left join public.profiles p on p.id = m.user_id
  where c.invite_code = lower(trim(p_code)) and not c.solo
  group by c.id, c.name, c.max_members;
$$;

-- ---------------------------------------------------------------------------
-- Moves: one each in a squad, up to 5 when playing solo.
-- ---------------------------------------------------------------------------
drop index if exists public.one_active_exercise_per_member;

create or replace function public.enforce_move_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_limit int;
begin
  if not new.active then
    return new;
  end if;
  select case when solo then 5 else 1 end into v_limit from public.crews where id = new.crew_id;
  if (select count(*) from public.potluck_exercises
      where crew_id = new.crew_id and user_id = new.user_id and active and id <> new.id) >= v_limit then
    raise exception 'You''ve already brought % move%. Swap one out first.', v_limit, case when v_limit = 1 then '' else 's' end;
  end if;
  return new;
end;
$$;

create trigger move_limit
  before insert or update on public.potluck_exercises
  for each row execute function public.enforce_move_limit();

-- ---------------------------------------------------------------------------
-- Challenges, RepRascal style
--   gauntlet : someone proposes it, the squad debates and votes. It starts once
--              more than half the squad votes yes. Everyone's in.
--   open     : a dare. Starts right away; people opt in if they're brave.
-- Both use goal = sets each person has to do in the window.
-- ---------------------------------------------------------------------------
alter table public.challenges drop constraint if exists challenges_kind_check;
alter table public.challenges add constraint challenges_kind_check
  check (kind in ('points', 'crew_goal', 'gauntlet', 'open'));
alter table public.challenges add constraint challenges_goal_needed
  check (kind not in ('gauntlet', 'open') or goal is not null);
alter table public.challenges
  add column status text not null default 'active' check (status in ('voting', 'active', 'rejected')),
  add column length_days int not null default 7 check (length_days between 1 and 92),
  add column details text not null default '' check (char_length(details) <= 500);

create table public.challenge_votes (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote boolean not null,
  voted_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table public.challenge_comments (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index challenge_comments_time on public.challenge_comments (challenge_id, created_at);

alter table public.challenge_votes enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_comments enable row level security;

create or replace function public.challenge_crew(p_challenge uuid)
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select crew_id from public.challenges where id = p_challenge;
$$;

create policy "members read votes" on public.challenge_votes
  for select using (public.is_crew_member(public.challenge_crew(challenge_id)));
create policy "members read participants" on public.challenge_participants
  for select using (public.is_crew_member(public.challenge_crew(challenge_id)));
create policy "members opt in" on public.challenge_participants
  for insert with check (
    user_id = auth.uid()
    and public.is_crew_member(public.challenge_crew(challenge_id))
    and exists (select 1 from public.challenges c where c.id = challenge_id and c.kind = 'open' and c.status = 'active')
  );
create policy "members back out" on public.challenge_participants
  for delete using (user_id = auth.uid());
create policy "members read debate" on public.challenge_comments
  for select using (public.is_crew_member(public.challenge_crew(challenge_id)));
create policy "members debate" on public.challenge_comments
  for insert with check (user_id = auth.uid() and public.is_crew_member(public.challenge_crew(challenge_id)));
create policy "delete own comment" on public.challenge_comments
  for delete using (user_id = auth.uid());

-- Gauntlets only change through the functions below, so votes can't be skipped.
drop policy if exists "members start challenges" on public.challenges;
create policy "members start challenges" on public.challenges
  for insert with check (created_by = auth.uid() and public.is_crew_member(crew_id) and kind <> 'gauntlet');
drop policy if exists "creator edits challenge" on public.challenges;
create policy "creator edits challenge" on public.challenges
  for update using (created_by = auth.uid() and kind <> 'gauntlet');

-- Starts the gauntlet if more than half the squad said yes, or shelves it if that can no longer happen.
create or replace function public.settle_gauntlet(p_challenge uuid, p_today date)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  c public.challenges;
  v_members int;
  v_yes int;
  v_no int;
begin
  select * into c from public.challenges where id = p_challenge for update;
  if c.status <> 'voting' then
    return c.status;
  end if;
  select count(*) into v_members from public.crew_members where crew_id = c.crew_id;
  select count(*) filter (where vote), count(*) filter (where not vote) into v_yes, v_no
  from public.challenge_votes where challenge_id = p_challenge;
  if v_yes * 2 > v_members then
    update public.challenges
    set status = 'active', start_date = p_today, end_date = p_today + (length_days - 1)
    where id = p_challenge;
    return 'active';
  elsif v_no * 2 >= v_members then
    update public.challenges set status = 'rejected' where id = p_challenge;
    return 'rejected';
  end if;
  return 'voting';
end;
$$;

create or replace function public.propose_gauntlet(
  p_crew uuid, p_title text, p_goal int, p_length int, p_stakes text, p_details text, p_today date
)
returns public.challenges
language plpgsql
security definer set search_path = public
as $$
declare
  c public.challenges;
begin
  if not public.is_crew_member(p_crew) then
    raise exception 'Only squad members can propose a gauntlet.';
  end if;
  insert into public.challenges (crew_id, created_by, title, kind, goal, start_date, end_date, stakes, status, length_days, details)
  values (p_crew, auth.uid(), trim(p_title), 'gauntlet', p_goal, p_today, p_today + (p_length - 1), trim(coalesce(p_stakes, '')), 'voting', p_length, trim(coalesce(p_details, '')))
  returning * into c;
  insert into public.challenge_votes (challenge_id, user_id, vote) values (c.id, auth.uid(), true);
  perform public.settle_gauntlet(c.id, p_today);
  select * into c from public.challenges where id = c.id;
  return c;
end;
$$;

create or replace function public.vote_gauntlet(p_challenge uuid, p_vote boolean, p_today date)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  c public.challenges;
begin
  select * into c from public.challenges where id = p_challenge;
  if c.id is null or c.kind <> 'gauntlet' or not public.is_crew_member(c.crew_id) then
    raise exception 'That gauntlet isn''t in your squad.';
  end if;
  if c.status <> 'voting' then
    raise exception 'Voting on this one is over.';
  end if;
  insert into public.challenge_votes (challenge_id, user_id, vote) values (p_challenge, auth.uid(), p_vote)
  on conflict (challenge_id, user_id) do update set vote = excluded.vote, voted_at = now();
  return public.settle_gauntlet(p_challenge, p_today);
end;
$$;

-- The proposer can change the terms while the squad is still debating. That clears the votes.
create or replace function public.amend_gauntlet(
  p_challenge uuid, p_title text, p_goal int, p_length int, p_stakes text, p_details text, p_today date
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.challenges
  set title = trim(p_title), goal = p_goal, length_days = p_length, end_date = start_date + (p_length - 1),
      stakes = trim(coalesce(p_stakes, '')), details = trim(coalesce(p_details, ''))
  where id = p_challenge and created_by = auth.uid() and kind = 'gauntlet' and status = 'voting';
  if not found then
    raise exception 'Only the person who proposed it can change it, and only while voting is open.';
  end if;
  delete from public.challenge_votes where challenge_id = p_challenge;
  insert into public.challenge_votes (challenge_id, user_id, vote) values (p_challenge, auth.uid(), true);
  perform public.settle_gauntlet(p_challenge, p_today);
end;
$$;

-- Starting an open dare signs you up for it.
create or replace function public.join_own_dare()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.kind = 'open' then
    insert into public.challenge_participants (challenge_id, user_id) values (new.id, new.created_by) on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger join_own_dare
  after insert on public.challenges
  for each row execute function public.join_own_dare();

grant select, insert, update, delete on
  public.challenge_votes, public.challenge_participants, public.challenge_comments
  to authenticated;
grant execute on function
  public.create_squad(text, boolean, boolean, int, text), public.public_squads(), public.join_public_squad(uuid),
  public.crew_preview(text), public.propose_gauntlet(uuid, text, int, int, text, text, date),
  public.vote_gauntlet(uuid, boolean, date), public.amend_gauntlet(uuid, text, int, int, text, text, date),
  public.challenge_crew(uuid)
  to authenticated;
revoke execute on function public.settle_gauntlet(uuid, date) from public, anon, authenticated;

alter publication supabase_realtime add table public.challenge_votes, public.challenge_comments, public.challenge_participants;
