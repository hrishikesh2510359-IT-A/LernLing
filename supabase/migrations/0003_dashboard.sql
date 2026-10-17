-- Dashboard support: join preview, badge awarding, owner/member reports, account deletion.
-- Run after 0002_ingest.sql.

-- Public preview for the invite page (anyone with the code can see group name, owner, size).
create function public.group_preview(code text) returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'name', g.name,
    'owner_name', p.display_name,
    'member_count', (select count(*) from group_members m where m.group_id = g.id)
  )
  from groups g join profiles p on p.id = g.owner_id
  where g.invite_code = code;
$$;
grant execute on function public.group_preview(text) to anon, authenticated;

-- Awards badges the caller has earned. Safe to call repeatedly.
create function public.award_my_badges() returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  tz text;
  best int;
  l int;
  q int;
begin
  if uid is null then return; end if;
  select timezone into tz from profiles where id = uid;
  select greatest(longest, current) into best from streaks where user_id = uid;

  insert into user_badges (user_id, badge_id)
  select uid, v.b from (values (3, 'streak_3'), (7, 'streak_7'), (14, 'streak_14'), (30, 'streak_30'), (100, 'streak_100')) v(n, b)
  where coalesce(best, 0) >= v.n
  on conflict do nothing;

  select count(*) filter (where kind = 'lesson'), count(*) filter (where kind = 'quiz')
  into l, q from lesson_events where user_id = uid;
  if l >= 1 then insert into user_badges (user_id, badge_id) values (uid, 'first_lesson') on conflict do nothing; end if;
  if q >= 10 then insert into user_badges (user_id, badge_id) values (uid, 'quiz_master') on conflict do nothing; end if;

  if exists (select 1 from activity_minutes where user_id = uid and extract(hour from (minute_ts at time zone tz)) >= 22) then
    insert into user_badges (user_id, badge_id) values (uid, 'night_owl') on conflict do nothing;
  end if;
  if exists (select 1 from activity_minutes where user_id = uid and extract(hour from (minute_ts at time zone tz)) between 4 and 6) then
    insert into user_badges (user_id, badge_id) values (uid, 'early_bird') on conflict do nothing;
  end if;
end $$;

-- Daily minutes split into watched video vs other active time. Self or group owner only.
create function public.member_activity(p_user uuid, p_days int default 30)
returns table(day date, watch_minutes int, other_minutes int, content_minutes int)
language plpgsql security definer set search_path = public stable as $$
declare tz text;
begin
  if not (p_user = auth.uid() or owns_group_of(p_user)) then raise exception 'not allowed'; end if;
  select timezone into tz from profiles where id = p_user;
  return query
  select (a.minute_ts at time zone tz)::date,
         coalesce(sum(a.active_seconds) filter (where a.kind = 'watch') / 60, 0)::int,
         coalesce(sum(a.active_seconds) filter (where a.kind <> 'watch') / 60, 0)::int,
         (coalesce(sum(a.content_seconds), 0) / 60)::int
  from activity_minutes a
  where a.user_id = p_user and a.minute_ts >= now() - make_interval(days => p_days)
  group by 1 order by 1;
end $$;

-- Per-course totals. Course names are hidden from others if the member turned sharing off.
create function public.member_courses(p_user uuid)
returns table(platform text, course_key text, minutes int, lessons int, last_active timestamptz)
language plpgsql security definer set search_path = public stable as $$
declare hide boolean;
begin
  if not (p_user = auth.uid() or owns_group_of(p_user)) then raise exception 'not allowed'; end if;
  select (not p.share_course_names) and p_user <> auth.uid() into hide from profiles p where p.id = p_user;
  return query
  with x as (
    select a.platform as pf, a.course_key as ck, sum(a.active_seconds) as secs, max(a.minute_ts) as last_ts
    from activity_minutes a where a.user_id = p_user group by 1, 2
  )
  select x.pf,
         case when hide then 'Hidden course' else x.ck end,
         (x.secs / 60)::int,
         (select count(*)::int from lesson_events l
            where l.user_id = p_user and l.platform = x.pf and l.course_key = x.ck and l.kind = 'lesson'),
         x.last_ts
  from x order by x.last_ts desc limit 30;
end $$;

-- Recent study sessions: one row per day per course.
create function public.member_sessions(p_user uuid, p_limit int default 20)
returns table(day date, platform text, course_key text, minutes int, lessons int)
language plpgsql security definer set search_path = public stable as $$
declare tz text; hide boolean;
begin
  if not (p_user = auth.uid() or owns_group_of(p_user)) then raise exception 'not allowed'; end if;
  select p.timezone, (not p.share_course_names) and p_user <> auth.uid() into tz, hide from profiles p where p.id = p_user;
  return query
  with x as (
    select (a.minute_ts at time zone tz)::date as d, a.platform as pf, a.course_key as ck, sum(a.active_seconds) as secs
    from activity_minutes a where a.user_id = p_user group by 1, 2, 3
  )
  select x.d, x.pf,
         case when hide then 'Hidden course' else x.ck end,
         (x.secs / 60)::int,
         (select count(*)::int from lesson_events l
            where l.user_id = p_user and l.platform = x.pf and l.course_key = x.ck
              and (l.occurred_at at time zone tz)::date = x.d)
  from x order by x.d desc, x.secs desc limit p_limit;
end $$;

-- Lets a user delete their own account and all their data (cascades).
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.award_my_badges() from public, anon;
revoke all on function public.member_activity(uuid, int) from public, anon;
revoke all on function public.member_courses(uuid) from public, anon;
revoke all on function public.member_sessions(uuid, int) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.award_my_badges() to authenticated;
grant execute on function public.member_activity(uuid, int) to authenticated;
grant execute on function public.member_courses(uuid) to authenticated;
grant execute on function public.member_sessions(uuid, int) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
