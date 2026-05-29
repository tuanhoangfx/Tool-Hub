# Apply hub identity migration to x1z10 P01 via Supabase Management API
param(
  [string]$ProjectRef = "fmnrafpzctuhxjaaomzt",
  [string]$MigrationFile = "$PSScriptRoot\..\supabase\migrations\20260529120000_hub_identity_profiles.sql"
)

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) {
  Write-Error "Missing SUPABASE_ACCESS_TOKEN"
  exit 1
}

$uri = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"
$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

function Invoke-Sql([string]$Query) {
  $body = (@{ query = $Query } | ConvertTo-Json -Compress -Depth 3)
  try {
    return Invoke-RestMethod -Uri $uri -Headers $headers -Method Post -Body $body
  } catch {
    $detail = $_.ErrorDetails.Message
    throw "SQL failed: $($_.Exception.Message) $detail"
  }
}

$chunks = @(
@'
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
'@,
@'
drop policy if exists "profiles_select_self_or_managers" on public.profiles;
create policy "profiles_select_self_or_managers"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and me.role in ('admin', 'manager')
  )
);
drop policy if exists "profiles_upsert_self" on public.profiles;
create policy "profiles_upsert_self"
on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update to authenticated
using (
  id = auth.uid()
  or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
)
with check (
  id = auth.uid()
  or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
);
'@,
@'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, last_sign_in_at)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'employee'),
    new.last_sign_in_at
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
'@
)

# workspace_user_directory in separate file read
$rpc = Get-Content -Raw (Join-Path $PSScriptRoot "..\supabase\migrations\20260529120000_hub_identity_profiles.sql")
$rpcStart = $rpc.IndexOf("create or replace function public.workspace_user_directory")
$rpcSql = $rpc.Substring($rpcStart).Trim()
$chunks += $rpcSql

$chunks += @'
insert into public.profiles (id, email, full_name, role, last_sign_in_at, created_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  coalesce(nullif(u.raw_app_meta_data ->> 'role', ''), 'employee'),
  u.last_sign_in_at,
  u.created_at
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = now();
'@

$i = 0
foreach ($chunk in $chunks) {
  $i++
  Write-Host "Chunk $i/$($chunks.Count)..."
  Invoke-Sql $chunk | Out-Null
}

$check = Invoke-Sql "select count(*)::int as profiles from public.profiles"
Write-Host "Done. profiles count:" ($check | ConvertTo-Json -Compress)
