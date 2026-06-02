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
