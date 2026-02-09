-- Ensure users cannot change ownership via UPDATE.

drop policy if exists "views_update_own" on public.views;

create policy "views_update_own"
  on public.views
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

