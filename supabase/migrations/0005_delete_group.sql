-- Lets a group's owner delete the group. Memberships and nudges for that group are removed
-- automatically (foreign keys cascade). Members' own study data and streaks are NOT touched.
-- Run after 0004_nudge_limit.sql.
create policy groups_delete on public.groups
  for delete using (owner_id = auth.uid());
