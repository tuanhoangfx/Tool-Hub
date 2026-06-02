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
