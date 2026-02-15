-- Account deletion + consent audit support

create table if not exists public.user_consents (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms', 'marketing')),
  consent_text text not null,
  consent_granted boolean not null default true,
  consented_at timestamp with time zone not null default now(),
  source text not null default 'web',
  request_ip text
);

create index if not exists idx_user_consents_user_id
  on public.user_consents (user_id, consented_at desc);

alter table public.user_consents enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_consents'
      and policyname = 'Users can read own consents'
  ) then
    create policy "Users can read own consents"
      on public.user_consents
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_consents'
      and policyname = 'Users can insert own consents'
  ) then
    create policy "Users can insert own consents"
      on public.user_consents
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

create or replace function public.record_user_consent(
  p_consent_type text,
  p_consent_text text,
  p_consent_granted boolean default true,
  p_source text default 'web'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_consents (
    user_id,
    consent_type,
    consent_text,
    consent_granted,
    source,
    request_ip
  )
  values (
    v_uid,
    coalesce(nullif(trim(p_consent_type), ''), 'terms'),
    coalesce(nullif(trim(p_consent_text), ''), 'Consent text not provided'),
    coalesce(p_consent_granted, true),
    coalesce(nullif(trim(p_source), ''), 'web'),
    inet_client_addr()::text
  );
end;
$$;

revoke all on function public.record_user_consent(text, text, boolean, text) from public;
grant execute on function public.record_user_consent(text, text, boolean, text) to authenticated;

create or replace function public.delete_my_account()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if to_regclass('public.user_consents') is not null then
    delete from public.user_consents where user_id = v_uid;
  end if;

  if to_regclass('public.answers') is not null then
    delete from public.answers where user_id = v_uid;
  end if;

  if to_regclass('public.user_progress') is not null then
    delete from public.user_progress where user_id = v_uid;
  end if;

  if to_regclass('public.leaderboard') is not null then
    delete from public.leaderboard where user_id = v_uid;
  end if;

  if to_regclass('public.profiles') is not null then
    delete from public.profiles where id = v_uid;
  end if;

  delete from auth.users where id = v_uid;

  return jsonb_build_object(
    'deleted', true,
    'user_id', v_uid::text
  );
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
