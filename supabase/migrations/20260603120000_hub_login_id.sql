-- P0004 Hub: User ID login + optional contact email (link after sign-up)

alter table public.profiles
  add column if not exists login_id text,
  add column if not exists contact_email text;

create unique index if not exists profiles_login_id_unique
  on public.profiles (lower(login_id))
  where login_id is not null and login_id <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_login_id text;
  v_contact text;
  v_auth_email text;
begin
  v_auth_email := lower(coalesce(new.email, ''));
  v_login_id := lower(trim(coalesce(new.raw_user_meta_data ->> 'login_id', '')));
  if v_login_id = '' and v_auth_email like '%@id.hub.x1z10.local' then
    v_login_id := split_part(v_auth_email, '@', 1);
  end if;
  if v_login_id = '' then
    v_login_id := null;
  end if;

  if v_auth_email like '%@id.hub.x1z10.local' then
    v_contact := nullif(trim(coalesce(new.raw_user_meta_data ->> 'contact_email', '')), '');
  else
    v_contact := v_auth_email;
  end if;

  insert into public.profiles (id, email, contact_email, login_id, full_name, role, last_sign_in_at)
  values (
    new.id,
    coalesce(v_contact, v_auth_email),
    v_contact,
    v_login_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(v_contact, v_auth_email), '@', 1)),
    coalesce(nullif(new.raw_app_meta_data ->> 'role', ''), 'user'),
    new.last_sign_in_at
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    contact_email = coalesce(excluded.contact_email, public.profiles.contact_email),
    login_id = coalesce(excluded.login_id, public.profiles.login_id),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();
  return new;
end;
$$;
