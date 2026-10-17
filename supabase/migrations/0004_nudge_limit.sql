-- At most one nudge per sender, recipient and (UTC) day, so nobody can spam a friend.
-- Run after 0003_dashboard.sql.
create unique index nudges_once_per_day
  on public.nudges (from_user, to_user, ((sent_at at time zone 'UTC')::date));
