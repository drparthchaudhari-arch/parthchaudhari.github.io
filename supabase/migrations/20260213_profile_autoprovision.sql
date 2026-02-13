-- Auto-provision profiles from auth.users
-- Prevents user_progress FK failures when profile row is missing.

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@local.invalid'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, new.id::text), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_profile_from_auth_user();

-- Backfill any pre-existing auth users missing a profile row.
insert into public.profiles (id, email, display_name)
select
  u.id,
  coalesce(u.email, u.id::text || '@local.invalid'),
  coalesce(u.raw_user_meta_data->>'display_name', split_part(coalesce(u.email, u.id::text), '@', 1))
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
);
