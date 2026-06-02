-- Fix: infinite recursion in profiles RLS when policies subquery public.profiles.

create or replace function public.is_hub_privileged()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and public.normalize_hub_role(p.role) in ('admin', 'manager')
  );
$$;

grant execute on function public.is_hub_privileged() to authenticated;

drop policy if exists "profiles_select_self_or_managers" on public.profiles;
create policy "profiles_select_self_or_managers"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_hub_privileged());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_hub_admin())
with check (id = auth.uid() or public.is_hub_admin());

drop policy if exists "tool_access_select" on public.tool_access;
create policy "tool_access_select"
on public.tool_access
for select
to authenticated
using (user_id = auth.uid() or public.is_hub_privileged());
