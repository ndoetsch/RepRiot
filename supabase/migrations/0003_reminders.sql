-- RepRascal (from Fitluck) reminders: phone notifications at the times each person picks.
-- Every 15 minutes the database asks the app to send whatever reminders are due.
-- Run after 0002_fun_layer.sql.

-- ---------------------------------------------------------------------------
-- Where to send notifications (one row per phone or browser)
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "own subscriptions read" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy "own subscriptions add" on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());
create policy "own subscriptions remove" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.push_subscriptions to authenticated;

-- ---------------------------------------------------------------------------
-- When to remind. Hours are local to the person, between 8 AM and 8 PM,
-- so quiet hours (9 PM to 8 AM) are always respected.
-- ---------------------------------------------------------------------------
create table public.reminder_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default true,
  hours int[] not null default '{10,13,16}'
    check (hours <@ array[8,9,10,11,12,13,14,15,16,17,18,19,20] and cardinality(hours) <= 6),
  tz text not null default 'America/New_York' check (char_length(tz) <= 64),
  last_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.reminder_prefs enable row level security;

create policy "own prefs read" on public.reminder_prefs
  for select to authenticated using (user_id = auth.uid());
create policy "own prefs add" on public.reminder_prefs
  for insert to authenticated with check (user_id = auth.uid());
create policy "own prefs change" on public.reminder_prefs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert on public.reminder_prefs to authenticated;
grant update (enabled, hours, tz, updated_at) on public.reminder_prefs to authenticated;

-- A bad time zone name would break the reminder query, so check it on the way in.
create or replace function public.check_reminder_tz()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.tz) then
    new.tz := 'America/New_York';
  end if;
  return new;
end $$;

create trigger reminder_prefs_tz before insert or update on public.reminder_prefs
  for each row execute function public.check_reminder_tz();

-- ---------------------------------------------------------------------------
-- A private password that only the database and the scheduled job know.
-- Nobody can read this table through the app.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.secrets (
  name text primary key,
  value text not null
);

insert into private.secrets (name, value)
values ('reminders', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Who should get a reminder right now. Called by the app's sender with the
-- private password. Marks people as reminded so nobody gets two in a row.
-- ---------------------------------------------------------------------------
create or replace function public.due_reminders(p_secret text)
returns table (endpoint text, p256dh text, auth text, sets_left int)
language plpgsql security definer set search_path = public as $$
declare
  ok boolean;
begin
  select exists (select 1 from private.secrets s where s.name = 'reminders' and s.value = p_secret) into ok;
  if not ok then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return query
  with due as (
    select r.user_id, (now() at time zone r.tz)::date as today
    from reminder_prefs r
    where r.enabled
      and extract(hour from now() at time zone r.tz)::int = any (r.hours)
      and extract(minute from now() at time zone r.tz) < 15
      and (r.last_sent_at is null or r.last_sent_at < now() - interval '30 minutes')
  ),
  left_today as (
    select d.user_id, sum(greatest(0, x.total - x.done))::int as sets_left
    from due d
    join crew_members m on m.user_id = d.user_id
    cross join lateral (
      select
        (select count(*) from potluck_exercises e where e.crew_id = m.crew_id and e.active) * 3 as total,
        (select count(*) from set_logs l
           join potluck_exercises e on e.id = l.exercise_id and e.active
           where l.crew_id = m.crew_id and l.user_id = d.user_id and l.local_date = d.today) as done
    ) x
    group by d.user_id
  ),
  marked as (
    update reminder_prefs r set last_sent_at = now()
    from left_today t
    where r.user_id = t.user_id and t.sets_left > 0
    returning r.user_id, t.sets_left
  )
  select s.endpoint, s.p256dh, s.auth, mk.sets_left
  from marked mk
  join push_subscriptions s on s.user_id = mk.user_id;
end $$;

-- The sender removes phones that have uninstalled or turned notifications off.
create or replace function public.drop_push_subscription(p_secret text, p_endpoint text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from private.secrets s where s.name = 'reminders' and s.value = p_secret) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from push_subscriptions where endpoint = p_endpoint;
end $$;

revoke all on function public.due_reminders(text) from public;
revoke all on function public.drop_push_subscription(text, text) from public;
grant execute on function public.due_reminders(text) to anon, authenticated;
grant execute on function public.drop_push_subscription(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Every 15 minutes, ask the app to send due reminders.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobname) from cron.job
where jobname in ('reprascal-reminders', 'repriot-reminders');

select cron.schedule(
  'reprascal-reminders',
  '*/15 * * * *',
  $job$
  select net.http_post(
    -- Change this to the app's real web address if it isn't reprascal.vercel.app.
    url := 'https://reprascal.vercel.app/api/reminders',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || (select value from private.secrets where name = 'reminders')
    ),
    body := '{}'::jsonb
  );
  $job$
);
