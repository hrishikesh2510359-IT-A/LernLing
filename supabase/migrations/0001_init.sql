-- Lernling initial schema + Row Level Security.
-- Writes to activity_minutes / lesson_events / daily_summary / streaks are NOT
-- allowed directly from clients; they go through security-definer functions
-- (ingest function comes in migration 0002, Phase 3).

create extension if not exists pgcrypto;

-- ---------- tables ----------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  avatar_url text,
  timezone text not null default 'UTC',
  share_course_names boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substr(encode(gen_random_bytes(6), 'hex'), 1, 8),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  daily_threshold_min int not null default 10 check (daily_threshold_min between 1 and 600),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on public.group_members (user_id);

create table public.site_settings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  hostname text not null,
  platform text not null default 'generic',
  progress_types text[] not null default '{active}',
  created_at timestamptz not null default now(),
  primary key (user_id, hostname)
);

-- One row per (user, minute): parallel tabs/devices cannot double count.
create table public.activity_minutes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  minute_ts timestamptz not null,
  platform text not null,
  course_key text not null,
  lesson_key text,
  kind text not null check (kind in ('watch', 'active', 'manual')),
  active_seconds smallint not null check (active_seconds between 1 and 60),
  content_seconds int not null default 0 check (content_seconds >= 0),
  muted boolean not null default false,
  primary key (user_id, minute_ts)
);

create table public.lesson_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  course_key text not null,
  lesson_key text not null,
  course_title text,
  lesson_title text,
  kind text not null check (kind in ('lesson', 'quiz')),
  occurred_at timestamptz not null default now(),
  unique (user_id, platform, course_key, lesson_key, kind)
);

create table public.daily_summary (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  active_minutes int not null default 0,
  lessons_done int not null default 0,
  quizzes_done int not null default 0,
  studied boolean not null default false,
  primary key (user_id, day)
);

create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current int not null default 0,
  longest int not null default 0,
  last_day date,
  freezes_available int not null default 1
);

create table public.badges (
  id text primary key,
  name text not null,
  description text not null
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id),
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  sent_at timestamptz not null default now(),
  seen_at timestamptz
);
create index on public.nudges (to_user, sent_at desc);

-- ---------- helper functions (security definer avoids RLS recursion) ----------

create function public.is_group_member(g uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from group_members where group_id = g and user_id = auth.uid());
$$;

create function public.shares_group_with(u uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select u = auth.uid() or exists (
    select 1 from group_members a join group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = u
  );
$$;

-- True if the caller owns a group that user u belongs to.
create function public.owns_group_of(u uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from group_members m join groups g on g.id = m.group_id
    where m.user_id = u and g.owner_id = auth.uid()
  );
$$;

-- ---------- signup + group functions ----------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Learner'),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into streaks (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create function public.create_group(group_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  insert into groups (name, owner_id) values (group_name, auth.uid()) returning id into gid;
  insert into group_members (group_id, user_id, role) values (gid, auth.uid(), 'owner');
  return gid;
end $$;

create function public.join_group(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  select id into gid from groups where invite_code = code;
  if gid is null then raise exception 'Invalid invite code'; end if;
  insert into group_members (group_id, user_id) values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end $$;

-- ---------- Row Level Security ----------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.site_settings enable row level security;
alter table public.activity_minutes enable row level security;
alter table public.lesson_events enable row level security;
alter table public.daily_summary enable row level security;
alter table public.streaks enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.nudges enable row level security;

-- profiles: see yourself and people in your groups; edit only yourself
create policy profiles_select on public.profiles for select using (shares_group_with(id));
create policy profiles_update on public.profiles for update using (id = auth.uid());

-- groups: members read; owner edits. Creation only via create_group().
create policy groups_select on public.groups for select using (is_group_member(id));
create policy groups_update on public.groups for update using (owner_id = auth.uid());

-- group_members: members see each other; you can leave. Joining only via join_group().
create policy gm_select on public.group_members for select using (is_group_member(group_id));
create policy gm_delete on public.group_members for delete using (user_id = auth.uid());

-- site_settings: private to the user
create policy ss_all on public.site_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- raw activity: own rows, plus group owner may read members' rows. No client writes.
create policy am_select on public.activity_minutes for select
  using (user_id = auth.uid() or owns_group_of(user_id));
create policy le_select on public.lesson_events for select
  using (user_id = auth.uid() or owns_group_of(user_id));

-- summaries and streaks: visible to group mates. No client writes.
create policy ds_select on public.daily_summary for select using (shares_group_with(user_id));
create policy st_select on public.streaks for select using (shares_group_with(user_id));

-- badges: catalog is public to signed-in users; earned badges visible to group mates
create policy badges_select on public.badges for select using (auth.uid() is not null);
create policy ub_select on public.user_badges for select using (shares_group_with(user_id));

-- nudges: send to someone in a shared group; read/mark your own
create policy nudges_insert on public.nudges for insert
  with check (from_user = auth.uid() and is_group_member(group_id) and shares_group_with(to_user));
create policy nudges_select on public.nudges for select
  using (to_user = auth.uid() or from_user = auth.uid());
create policy nudges_update on public.nudges for update using (to_user = auth.uid());

-- seed badges
insert into public.badges (id, name, description) values
  ('streak_3', '3-day streak', 'Studied 3 days in a row'),
  ('streak_7', '7-day streak', 'Studied 7 days in a row'),
  ('streak_14', '14-day streak', 'Studied 14 days in a row'),
  ('streak_30', '30-day streak', 'Studied 30 days in a row'),
  ('streak_100', '100-day streak', 'Studied 100 days in a row'),
  ('first_lesson', 'First lesson', 'Completed your first lesson'),
  ('first_course', 'Course finished', 'Finished a whole course'),
  ('night_owl', 'Night owl', 'Studied after 10 pm'),
  ('early_bird', 'Early bird', 'Studied before 7 am'),
  ('quiz_master', 'Quiz master', 'Passed 10 quizzes');
