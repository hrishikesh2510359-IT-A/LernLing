-- Ingest + streak recompute. Run after 0001_init.sql.
-- Clients never write activity tables directly; they call ingest_activity().

-- Recompute one day's summary for a user (timezone-aware).
create function public.recompute_day(uid uuid, d date) returns void
language plpgsql security definer set search_path = public as $$
declare
  tz text;
  threshold int;
  secs int;
  lessons int;
  quizzes int;
  mins int;
begin
  select timezone into tz from profiles where id = uid;

  select coalesce(sum(active_seconds), 0) into secs
  from activity_minutes
  where user_id = uid and (minute_ts at time zone tz)::date = d;

  -- daily cap: never count more than 12 hours
  mins := least(secs / 60, 720);

  select count(*) filter (where kind = 'lesson'), count(*) filter (where kind = 'quiz')
  into lessons, quizzes
  from lesson_events
  where user_id = uid and (occurred_at at time zone tz)::date = d;

  -- if the user is in several groups, the lowest threshold applies (simple, documented in PLAN.md)
  select coalesce(min(g.daily_threshold_min), 10) into threshold
  from group_members gm join groups g on g.id = gm.group_id
  where gm.user_id = uid;

  insert into daily_summary (user_id, day, active_minutes, lessons_done, quizzes_done, studied)
  values (uid, d, mins, lessons, quizzes, (mins >= threshold or lessons >= 1 or quizzes >= 1))
  on conflict (user_id, day) do update set
    active_minutes = excluded.active_minutes,
    lessons_done = excluded.lessons_done,
    quizzes_done = excluded.quizzes_done,
    studied = excluded.studied;
end $$;

-- Streak = run of consecutive studied days ending today or yesterday.
-- (Streak freezes are not applied yet.)
create function public.recompute_streak(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  tz text;
  today date;
  latest date;
  cnt int;
  best int;
begin
  select timezone into tz from profiles where id = uid;
  today := (now() at time zone tz)::date;

  with s as (
    select day, day + (row_number() over (order by day desc))::int as grp
    from daily_summary where user_id = uid and studied
  ), head as (
    select grp, day from s order by day desc limit 1
  )
  select (select day from head), count(*) into latest, cnt
  from s where grp = (select grp from head);

  select coalesce(max(c), 0) into best from (
    select count(*) as c from (
      select day, day - (row_number() over (order by day))::int as g
      from daily_summary where user_id = uid and studied
    ) x group by g
  ) y;

  insert into streaks (user_id) values (uid) on conflict do nothing;
  update streaks set
    current = case when latest is not null and latest >= today - 1 then coalesce(cnt, 0) else 0 end,
    longest = greatest(longest, best),
    last_day = latest
  where user_id = uid;
end $$;

create function public.ingest_activity(p_minutes jsonb default '[]'::jsonb, p_lessons jsonb default '[]'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  tz text;
  today date;
  was_studied boolean;
  m jsonb;
  l jsonb;
  ts timestamptz;
  d date;
  affected date[] := '{}';
  recent_lessons int;
  summary record;
  st record;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  select timezone into tz from profiles where id = uid;
  today := (now() at time zone tz)::date;
  select coalesce((select studied from daily_summary where user_id = uid and day = today), false)
    into was_studied;

  for m in select * from jsonb_array_elements(p_minutes) loop
    ts := date_trunc('minute', (m->>'minute_ts')::timestamptz);
    -- reject timestamps in the future or too old
    if ts > now() + interval '2 minutes' or ts < now() - interval '3 days' then continue; end if;
    if (m->>'kind') not in ('watch', 'active', 'manual') then continue; end if;

    insert into activity_minutes
      (user_id, minute_ts, platform, course_key, lesson_key, kind, active_seconds, content_seconds, muted)
    values (
      uid, ts,
      left(m->>'platform', 40),
      left(m->>'course_key', 200),
      left(m->>'lesson_key', 200),
      m->>'kind',
      greatest(1, least(60, coalesce((m->>'active_seconds')::int, 1))),
      greatest(0, least(600, coalesce((m->>'content_seconds')::int, 0))),
      coalesce((m->>'muted')::boolean, false)
    )
    -- parallel tabs/devices: keep the larger value, never add
    on conflict (user_id, minute_ts) do update set
      active_seconds = greatest(activity_minutes.active_seconds, excluded.active_seconds),
      content_seconds = greatest(activity_minutes.content_seconds, excluded.content_seconds);

    affected := affected || (ts at time zone tz)::date;
  end loop;

  for l in select * from jsonb_array_elements(p_lessons) loop
    if (l->>'kind') not in ('lesson', 'quiz') then continue; end if;
    select count(*) into recent_lessons from lesson_events
      where user_id = uid and occurred_at > now() - interval '1 hour';
    if recent_lessons >= 6 then continue; end if;

    insert into lesson_events
      (user_id, platform, course_key, lesson_key, course_title, lesson_title, kind, occurred_at)
    values (
      uid,
      left(l->>'platform', 40),
      left(l->>'course_key', 200),
      left(l->>'lesson_key', 200),
      left(l->>'course_title', 300),
      left(l->>'lesson_title', 300),
      l->>'kind',
      now()
    )
    on conflict do nothing;

    affected := affected || today;
  end loop;

  for d in select distinct unnest(affected) loop
    perform recompute_day(uid, d);
  end loop;
  if array_length(affected, 1) is not null then
    perform recompute_streak(uid);
  end if;

  select * into summary from daily_summary where user_id = uid and day = today;
  select * into st from streaks where user_id = uid;

  return jsonb_build_object(
    'day', today,
    'active_minutes', coalesce(summary.active_minutes, 0),
    'lessons_done', coalesce(summary.lessons_done, 0),
    'studied', coalesce(summary.studied, false),
    'newly_studied', coalesce(summary.studied, false) and not was_studied,
    'streak', coalesce(st.current, 0),
    'longest', coalesce(st.longest, 0)
  );
end $$;

revoke all on function public.ingest_activity(jsonb, jsonb) from public, anon;
grant execute on function public.ingest_activity(jsonb, jsonb) to authenticated;
revoke all on function public.recompute_day(uuid, date) from public, anon, authenticated;
revoke all on function public.recompute_streak(uuid) from public, anon, authenticated;
