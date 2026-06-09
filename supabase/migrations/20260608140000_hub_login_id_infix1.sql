-- Hub profiles trigger: recognize @infix1.io.vn synthetic emails (canonical) + legacy domain.

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
  v_is_synthetic boolean;
begin
  v_auth_email := lower(coalesce(new.email, ''));
  v_is_synthetic := v_auth_email like '%@infix1.io.vn'
    or v_auth_email like '%@id.hub.x1z10.local';

  v_login_id := lower(trim(coalesce(new.raw_user_meta_data ->> 'login_id', '')));
  if v_login_id = '' and v_is_synthetic then
    v_login_id := split_part(v_auth_email, '@', 1);
  end if;
  if v_login_id = '' then
    v_login_id := null;
  end if;

  if v_is_synthetic then
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
