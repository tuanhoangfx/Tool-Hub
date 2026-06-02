-- === 20260529120000_hub_identity_profiles.sql ===
-- P0004 Tool Hub identity (x1z10 P01 / fmnrafpzctuhxjaaomzt)
-- Profiles + user directory RPC (no Todo project_members dependency)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  role text not null default 'employee',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  last_sign_in_at timestamptz
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_managers" on public.profiles;
create policy "profiles_select_self_or_managers"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.role in ('admin', 'manager')
  )
);

drop policy if exists "profiles_upsert_self" on public.profiles;
create policy "profiles_upsert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.role = 'admin'
  )
)
with check (
  id = auth.uid()
  or exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.role = 'admin'
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, last_sign_in_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'employee'),
    new.last_sign_in_at
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.workspace_user_directory()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  last_activity_at timestamptz,
  project_count integer,
  project_names text[],
  activity_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee')
  into v_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_uid;

  return query
  select
    u.id,
    u.email::text,
    coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text as full_name,
    case
      when coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') in ('admin', 'manager', 'employee')
        then coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee')
      else 'employee'
    end::text as role,
    coalesce(nullif(p.avatar_url::text, ''), u.raw_user_meta_data ->> 'avatar_url')::text as avatar_url,
    u.created_at,
    coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz as updated_at,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz as last_sign_in_at,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz as last_activity_at,
    0::integer as project_count,
    array[]::text[] as project_names,
    0::integer as activity_count
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce(v_role, 'employee') in ('admin', 'manager')
     or u.id = v_uid
  order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text);
end;
$$;

grant execute on function public.workspace_user_directory() to authenticated;


-- === 20260530140000_hub_user_directory_projects.sql ===
-- Enrich workspace_user_directory with project_members + activity_logs when tables exist on x1z10 P01.

create or replace function public.workspace_user_directory()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  last_activity_at timestamptz,
  project_count integer,
  project_names text[],
  activity_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_has_projects boolean := to_regclass('public.project_members') is not null
    and to_regclass('public.projects') is not null;
  v_has_activity boolean := to_regclass('public.activity_logs') is not null;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee')
  into v_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_uid;

  if v_has_projects and v_has_activity then
    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      project_agg as (
        select pm.user_id,
          count(distinct pm.project_id)::integer as project_count,
          coalesce(array_agg(distinct pr.name order by pr.name) filter (where nullif(pr.name, '') is not null), array[]::text[]) as project_names
        from public.project_members pm
        left join public.projects pr on pr.id = pm.project_id
        group by pm.user_id
      ),
      activity_agg as (
        select al.user_id, count(*)::integer as activity_count, max(al.created_at) as last_activity_at
        from public.activity_logs al
        group by al.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        case when coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') in ('admin','manager','employee')
          then coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') else 'employee' end::text,
        coalesce(nullif(p.avatar_url::text, ''), u.raw_user_meta_data ->> 'avatar_url')::text,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        greatest(coalesce(u.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(p.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(aa.last_activity_at, '-infinity'::timestamptz))::timestamptz,
        coalesce(pa.project_count, 0)::integer, coalesce(pa.project_names, array[]::text[])::text[],
        coalesce(aa.activity_count, 0)::integer
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join project_agg pa on pa.user_id = u.id
      left join activity_agg aa on aa.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'employee'), v_uid;
  elsif v_has_projects then
    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      project_agg as (
        select pm.user_id,
          count(distinct pm.project_id)::integer as project_count,
          coalesce(array_agg(distinct pr.name order by pr.name) filter (where nullif(pr.name, '') is not null), array[]::text[]) as project_names
        from public.project_members pm
        left join public.projects pr on pr.id = pm.project_id
        group by pm.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        case when coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') in ('admin','manager','employee')
          then coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') else 'employee' end::text,
        coalesce(nullif(p.avatar_url::text, ''), u.raw_user_meta_data ->> 'avatar_url')::text,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        coalesce(pa.project_count, 0)::integer, coalesce(pa.project_names, array[]::text[])::text[],
        0::integer
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join project_agg pa on pa.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'employee'), v_uid;
  end if;

  return query
  select u.id, u.email::text,
    coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
    case when coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') in ('admin','manager','employee')
      then coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') else 'employee' end::text,
    coalesce(nullif(p.avatar_url::text, ''), u.raw_user_meta_data ->> 'avatar_url')::text,
    u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
    0::integer, array[]::text[], 0::integer
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce(v_role, 'employee') in ('admin', 'manager') or u.id = v_uid
  order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text);
end;
$$;

grant execute on function public.workspace_user_directory() to authenticated;


-- === 20260530160000_hub_workspace_identity_schema.sql ===
-- P0004 Hub: workspace projects, memberships, activity, legacy ID maps (Phase 0)

-- Projects (Todo/Data Box compatible: bigint id + source_ref for multi-origin import)
create table if not exists public.projects (
  id bigint generated by default as identity primary key,
  name text not null,
  color text,
  created_by uuid references auth.users (id) on delete set null,
  source_ref text not null default 'manual',
  legacy_project_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint projects_source_legacy_unique unique (source_ref, legacy_project_id)
);

create index if not exists projects_source_ref_idx on public.projects (source_ref);
create index if not exists projects_name_idx on public.projects (name);

create table if not exists public.project_members (
  project_id bigint not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_id_idx on public.project_members (user_id);

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  action text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_id_idx on public.activity_logs (user_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);

-- Map legacy Supabase project user UUID → Hub auth.users UUID
create table if not exists public.legacy_user_map (
  source_ref text not null,
  legacy_user_id uuid not null,
  hub_user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  migrated_at timestamptz not null default now(),
  primary key (source_ref, legacy_user_id)
);

create index if not exists legacy_user_map_email_idx on public.legacy_user_map (source_ref, email);

create index if not exists legacy_user_map_hub_user_id_idx on public.legacy_user_map (hub_user_id);

create table if not exists public.legacy_project_map (
  source_ref text not null,
  legacy_project_id bigint not null,
  hub_project_id bigint not null references public.projects (id) on delete cascade,
  migrated_at timestamptz not null default now(),
  primary key (source_ref, legacy_project_id)
);

alter table public.profiles add column if not exists default_project_id bigint;

-- RLS
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.activity_logs enable row level security;
alter table public.legacy_user_map enable row level security;
alter table public.legacy_project_map enable row level security;

drop policy if exists "projects_select_authenticated" on public.projects;
create policy "projects_select_authenticated"
on public.projects for select to authenticated
using (
  exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and me.role in ('admin', 'manager')
  )
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = projects.id and pm.user_id = auth.uid()
  )
);

drop policy if exists "projects_write_admin" on public.projects;
create policy "projects_write_admin"
on public.projects for all to authenticated
using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
)
with check (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
);

drop policy if exists "project_members_select" on public.project_members;
create policy "project_members_select"
on public.project_members for select to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role in ('admin', 'manager'))
);

drop policy if exists "project_members_write_admin" on public.project_members;
create policy "project_members_write_admin"
on public.project_members for all to authenticated
using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
)
with check (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
);

drop policy if exists "activity_logs_select" on public.activity_logs;
create policy "activity_logs_select"
on public.activity_logs for select to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role in ('admin', 'manager'))
);

drop policy if exists "legacy_maps_admin_select" on public.legacy_user_map;
create policy "legacy_maps_admin_select"
on public.legacy_user_map for select to authenticated
using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.role in ('admin', 'manager'))
);

drop policy if exists "legacy_project_maps_admin_select" on public.legacy_project_map;
create policy "legacy_project_maps_admin_select"
on public.legacy_project_map for select to authenticated
using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.role in ('admin', 'manager'))
);

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_members to authenticated;
grant select, insert on public.activity_logs to authenticated;
grant select on public.legacy_user_map to authenticated;
grant select on public.legacy_project_map to authenticated;


-- === 20260530180000_hub_user_directory_no_external_avatars.sql ===
-- Hub Users UI uses initials only; stop surfacing broken Data Box storage URLs.

create or replace function public.workspace_user_directory()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  last_activity_at timestamptz,
  project_count integer,
  project_names text[],
  activity_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_has_projects boolean := to_regclass('public.project_members') is not null
    and to_regclass('public.projects') is not null;
  v_has_activity boolean := to_regclass('public.activity_logs') is not null;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee')
  into v_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_uid;

  if v_has_projects and v_has_activity then
    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      project_agg as (
        select pm.user_id,
          count(distinct pm.project_id)::integer as project_count,
          coalesce(array_agg(distinct pr.name order by pr.name) filter (where nullif(pr.name, '') is not null), array[]::text[]) as project_names
        from public.project_members pm
        left join public.projects pr on pr.id = pm.project_id
        group by pm.user_id
      ),
      activity_agg as (
        select al.user_id, count(*)::integer as activity_count, max(al.created_at) as last_activity_at
        from public.activity_logs al
        group by al.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        case when coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') in ('admin','manager','employee')
          then coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') else 'employee' end::text,
        null::text as avatar_url,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        greatest(coalesce(u.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(p.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(aa.last_activity_at, '-infinity'::timestamptz))::timestamptz,
        coalesce(pa.project_count, 0)::integer, coalesce(pa.project_names, array[]::text[])::text[],
        coalesce(aa.activity_count, 0)::integer
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join project_agg pa on pa.user_id = u.id
      left join activity_agg aa on aa.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'employee'), v_uid;
  elsif v_has_projects then
    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      project_agg as (
        select pm.user_id,
          count(distinct pm.project_id)::integer as project_count,
          coalesce(array_agg(distinct pr.name order by pr.name) filter (where nullif(pr.name, '') is not null), array[]::text[]) as project_names
        from public.project_members pm
        left join public.projects pr on pr.id = pm.project_id
        group by pm.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        case when coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') in ('admin','manager','employee')
          then coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') else 'employee' end::text,
        null::text as avatar_url,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        coalesce(pa.project_count, 0)::integer, coalesce(pa.project_names, array[]::text[])::text[],
        0::integer
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join project_agg pa on pa.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'employee'), v_uid;
  end if;

  return query
  select u.id, u.email::text,
    coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
    case when coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') in ('admin','manager','employee')
      then coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'employee') else 'employee' end::text,
    null::text as avatar_url,
    u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
    0::integer, array[]::text[], 0::integer
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce(v_role, 'employee') in ('admin', 'manager') or u.id = v_uid
  order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text);
end;
$$;

update public.profiles set avatar_url = null where avatar_url is not null;

grant execute on function public.workspace_user_directory() to authenticated;


-- === 20260530190000_hub_role_user.sql ===
-- Rename workspace role employee → user (DB + RPC + trigger).

create or replace function public.normalize_hub_role(raw text)
returns text
language sql
immutable
as $$
  select case
    when raw in ('admin', 'manager') then raw
    when raw in ('user', 'employee') then 'user'
    else 'user'
  end;
$$;

update public.profiles set role = 'user' where role = 'employee' or role is null;

alter table public.profiles alter column role set default 'user';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, last_sign_in_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    public.normalize_hub_role(coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'user')),
    new.last_sign_in_at
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();
  return new;
end;
$$;

create or replace function public.workspace_user_directory()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  last_activity_at timestamptz,
  project_count integer,
  project_names text[],
  activity_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_has_projects boolean := to_regclass('public.project_members') is not null
    and to_regclass('public.projects') is not null;
  v_has_activity boolean := to_regclass('public.activity_logs') is not null;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))
  into v_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_uid;

  if v_has_projects and v_has_activity then
    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      project_agg as (
        select pm.user_id,
          count(distinct pm.project_id)::integer as project_count,
          coalesce(array_agg(distinct pr.name order by pr.name) filter (where nullif(pr.name, '') is not null), array[]::text[]) as project_names
        from public.project_members pm
        left join public.projects pr on pr.id = pm.project_id
        group by pm.user_id
      ),
      activity_agg as (
        select al.user_id, count(*)::integer as activity_count, max(al.created_at) as last_activity_at
        from public.activity_logs al
        group by al.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))::text,
        null::text as avatar_url,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        greatest(coalesce(u.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(p.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(aa.last_activity_at, '-infinity'::timestamptz))::timestamptz,
        coalesce(pa.project_count, 0)::integer, coalesce(pa.project_names, array[]::text[])::text[],
        coalesce(aa.activity_count, 0)::integer
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join project_agg pa on pa.user_id = u.id
      left join activity_agg aa on aa.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'user'), v_uid;
  elsif v_has_projects then
    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      project_agg as (
        select pm.user_id,
          count(distinct pm.project_id)::integer as project_count,
          coalesce(array_agg(distinct pr.name order by pr.name) filter (where nullif(pr.name, '') is not null), array[]::text[]) as project_names
        from public.project_members pm
        left join public.projects pr on pr.id = pm.project_id
        group by pm.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))::text,
        null::text as avatar_url,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        coalesce(pa.project_count, 0)::integer, coalesce(pa.project_names, array[]::text[])::text[],
        0::integer
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join project_agg pa on pa.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'user'), v_uid;
  end if;

  return query
  select u.id, u.email::text,
    coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
    public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))::text,
    null::text as avatar_url,
    u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
    0::integer, array[]::text[], 0::integer
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce(v_role, 'user') in ('admin', 'manager') or u.id = v_uid
  order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text);
end;
$$;

grant execute on function public.normalize_hub_role(text) to authenticated;
grant execute on function public.workspace_user_directory() to authenticated;


-- === 20260531120000_hub_tool_access.sql ===
-- V2: Hub tool catalog + per-user tool_access (legacy projects unchanged).

create or replace function public.is_hub_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and public.normalize_hub_role(p.role) = 'admin'
  );
$$;

create table if not exists public.hub_tools (
  tool_code text primary key,
  name text not null,
  category text,
  status text,
  archived_at timestamptz,
  synced_at timestamptz not null default now()
);

create index if not exists hub_tools_name_idx on public.hub_tools (name);

create table if not exists public.tool_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_code text not null references public.hub_tools (tool_code) on delete cascade,
  permission text not null default 'access' check (permission in ('access')),
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  primary key (user_id, tool_code)
);

create index if not exists tool_access_user_id_idx on public.tool_access (user_id);
create index if not exists tool_access_tool_code_idx on public.tool_access (tool_code);

alter table public.hub_tools enable row level security;
alter table public.tool_access enable row level security;

drop policy if exists "hub_tools_select_authenticated" on public.hub_tools;
create policy "hub_tools_select_authenticated"
on public.hub_tools for select to authenticated
using (true);

drop policy if exists "hub_tools_write_admin" on public.hub_tools;
create policy "hub_tools_write_admin"
on public.hub_tools for all to authenticated
using (public.is_hub_admin())
with check (public.is_hub_admin());

drop policy if exists "tool_access_select" on public.tool_access;
create policy "tool_access_select"
on public.tool_access for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and public.normalize_hub_role(me.role) in ('admin', 'manager')
  )
);

drop policy if exists "tool_access_write_admin" on public.tool_access;
create policy "tool_access_write_admin"
on public.tool_access for all to authenticated
using (public.is_hub_admin())
with check (public.is_hub_admin());

grant select on public.hub_tools to authenticated;
grant select, insert, update, delete on public.tool_access to authenticated;

-- Upsert tools from workspace catalog JSON: [{ "tool_code", "name", "category", "status" }, ...]
create or replace function public.sync_hub_tools(p_tools jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_code text;
  v_count integer := 0;
  v_seen text[] := array[]::text[];
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if jsonb_typeof(p_tools) <> 'array' then
    raise exception 'p_tools must be a JSON array';
  end if;

  for v_item in select * from jsonb_array_elements(p_tools)
  loop
    v_code := nullif(trim(both from v_item ->> 'tool_code'), '');
    if v_code is null then
      continue;
    end if;
    v_seen := array_append(v_seen, v_code);
    insert into public.hub_tools (tool_code, name, category, status, archived_at, synced_at)
    values (
      v_code,
      coalesce(nullif(trim(v_item ->> 'name'), ''), v_code),
      nullif(trim(v_item ->> 'category'), ''),
      nullif(trim(v_item ->> 'status'), ''),
      null,
      now()
    )
    on conflict (tool_code) do update set
      name = excluded.name,
      category = excluded.category,
      status = excluded.status,
      archived_at = null,
      synced_at = now();
    v_count := v_count + 1;
  end loop;

  update public.hub_tools ht
  set archived_at = now()
  where ht.archived_at is null
    and not (ht.tool_code = any (v_seen));

  return v_count;
end;
$$;

grant execute on function public.sync_hub_tools(jsonb) to authenticated;

drop function if exists public.workspace_user_directory();

create or replace function public.workspace_user_directory()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  last_activity_at timestamptz,
  project_count integer,
  project_names text[],
  activity_count integer,
  tool_count integer,
  tool_codes text[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_has_projects boolean := to_regclass('public.project_members') is not null
    and to_regclass('public.projects') is not null;
  v_has_activity boolean := to_regclass('public.activity_logs') is not null;
  v_has_tools boolean := to_regclass('public.tool_access') is not null
    and to_regclass('public.hub_tools') is not null;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))
  into v_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_uid;

  if v_has_tools then
  if v_has_projects and v_has_activity then
    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      active_tools as (
        select tool_code from public.hub_tools where archived_at is null
      ),
      all_tool_codes as (
        select coalesce(array_agg(tool_code order by tool_code), array[]::text[]) as codes,
               count(*)::integer as cnt
        from active_tools
      ),
      project_agg as (
        select pm.user_id,
          count(distinct pm.project_id)::integer as project_count,
          coalesce(array_agg(distinct pr.name order by pr.name) filter (where nullif(pr.name, '') is not null), array[]::text[]) as project_names
        from public.project_members pm
        left join public.projects pr on pr.id = pm.project_id
        group by pm.user_id
      ),
      tool_agg as (
        select ta.user_id,
          count(distinct ta.tool_code)::integer as tool_count,
          coalesce(array_agg(distinct ta.tool_code order by ta.tool_code), array[]::text[]) as tool_codes
        from public.tool_access ta
        inner join active_tools at on at.tool_code = ta.tool_code
        group by ta.user_id
      ),
      activity_agg as (
        select al.user_id, count(*)::integer as activity_count, max(al.created_at) as last_activity_at
        from public.activity_logs al
        group by al.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))::text,
        null::text,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        greatest(coalesce(u.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(p.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(aa.last_activity_at, '-infinity'::timestamptz))::timestamptz,
        coalesce(pa.project_count, 0)::integer, coalesce(pa.project_names, array[]::text[])::text[],
        coalesce(aa.activity_count, 0)::integer,
        case when public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user')) = 'admin'
          then (select cnt from all_tool_codes) else coalesce(ta.tool_count, 0) end::integer,
        case when public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user')) = 'admin'
          then (select codes from all_tool_codes) else coalesce(ta.tool_codes, array[]::text[]) end::text[]
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join project_agg pa on pa.user_id = u.id
      left join tool_agg ta on ta.user_id = u.id
      left join activity_agg aa on aa.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'user'), v_uid;
    return;
  elsif v_has_projects then
    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      active_tools as (
        select tool_code from public.hub_tools where archived_at is null
      ),
      all_tool_codes as (
        select coalesce(array_agg(tool_code order by tool_code), array[]::text[]) as codes,
               count(*)::integer as cnt
        from active_tools
      ),
      project_agg as (
        select pm.user_id,
          count(distinct pm.project_id)::integer as project_count,
          coalesce(array_agg(distinct pr.name order by pr.name) filter (where nullif(pr.name, '') is not null), array[]::text[]) as project_names
        from public.project_members pm
        left join public.projects pr on pr.id = pm.project_id
        group by pm.user_id
      ),
      tool_agg as (
        select ta.user_id,
          count(distinct ta.tool_code)::integer as tool_count,
          coalesce(array_agg(distinct ta.tool_code order by ta.tool_code), array[]::text[]) as tool_codes
        from public.tool_access ta
        inner join active_tools at on at.tool_code = ta.tool_code
        group by ta.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))::text,
        null::text,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        coalesce(pa.project_count, 0)::integer, coalesce(pa.project_names, array[]::text[])::text[],
        0::integer,
        case when public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user')) = 'admin'
          then (select cnt from all_tool_codes) else coalesce(ta.tool_count, 0) end::integer,
        case when public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user')) = 'admin'
          then (select codes from all_tool_codes) else coalesce(ta.tool_codes, array[]::text[]) end::text[]
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join project_agg pa on pa.user_id = u.id
      left join tool_agg ta on ta.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'user'), v_uid;
    return;
  end if;

    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      active_tools as (
        select tool_code from public.hub_tools where archived_at is null
      ),
      all_tool_codes as (
        select coalesce(array_agg(tool_code order by tool_code), array[]::text[]) as codes,
               count(*)::integer as cnt
        from active_tools
      ),
      tool_agg as (
        select ta.user_id,
          count(distinct ta.tool_code)::integer as tool_count,
          coalesce(array_agg(distinct ta.tool_code order by ta.tool_code), array[]::text[]) as tool_codes
        from public.tool_access ta
        inner join active_tools at on at.tool_code = ta.tool_code
        group by ta.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))::text,
        null::text,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        0::integer, array[]::text[], 0::integer,
        case when public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user')) = 'admin'
          then (select cnt from all_tool_codes) else coalesce(ta.tool_count, 0) end::integer,
        case when public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user')) = 'admin'
          then (select codes from all_tool_codes) else coalesce(ta.tool_codes, array[]::text[]) end::text[]
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join tool_agg ta on ta.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'user'), v_uid;
    return;
  end if;

  -- Fallback without tool tables (legacy RPC shape + zero tools)
  if v_has_projects and v_has_activity then
    return query execute $q$
      with scoped_users as (
        select u.* from auth.users u
        where $1 in ('admin', 'manager') or u.id = $2
      ),
      project_agg as (
        select pm.user_id,
          count(distinct pm.project_id)::integer as project_count,
          coalesce(array_agg(distinct pr.name order by pr.name) filter (where nullif(pr.name, '') is not null), array[]::text[]) as project_names
        from public.project_members pm
        left join public.projects pr on pr.id = pm.project_id
        group by pm.user_id
      ),
      activity_agg as (
        select al.user_id, count(*)::integer as activity_count, max(al.created_at) as last_activity_at
        from public.activity_logs al
        group by al.user_id
      )
      select u.id, u.email::text,
        coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
        public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))::text,
        null::text,
        u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
        coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
        greatest(coalesce(u.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(p.last_sign_in_at::timestamptz, '-infinity'::timestamptz), coalesce(aa.last_activity_at, '-infinity'::timestamptz))::timestamptz,
        coalesce(pa.project_count, 0)::integer, coalesce(pa.project_names, array[]::text[])::text[],
        coalesce(aa.activity_count, 0)::integer,
        0::integer, array[]::text[]
      from scoped_users u
      left join public.profiles p on p.id = u.id
      left join project_agg pa on pa.user_id = u.id
      left join activity_agg aa on aa.user_id = u.id
      order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text)
    $q$ using coalesce(v_role, 'user'), v_uid;
    return;
  end if;

  return query
  select u.id, u.email::text,
    coalesce(nullif(p.full_name::text, ''), u.raw_user_meta_data ->> 'full_name', u.email, u.id::text)::text,
    public.normalize_hub_role(coalesce(nullif(p.role::text, ''), u.raw_app_meta_data ->> 'role', 'user'))::text,
    null::text,
    u.created_at, coalesce(u.updated_at::timestamptz, p.updated_at::timestamptz)::timestamptz,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
    coalesce(u.last_sign_in_at::timestamptz, p.last_sign_in_at::timestamptz)::timestamptz,
    0::integer, array[]::text[], 0::integer, 0::integer, array[]::text[]
  from auth.users u
  left join public.profiles p on p.id = u.id
  where coalesce(v_role, 'user') in ('admin', 'manager') or u.id = v_uid
  order by coalesce(nullif(p.full_name::text, ''), u.email, u.id::text);
end;
$$;

grant execute on function public.workspace_user_directory() to authenticated;


-- === 20260531130000_fix_profiles_rls_recursion.sql ===
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

