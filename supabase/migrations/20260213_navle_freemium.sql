-- NAVLE freemium model: daily question gating + answer analytics
-- Safe to run on an existing project (idempotent where possible).

create extension if not exists pgcrypto;

-- Add freemium/subscription tracking to existing profiles table.
alter table profiles
  add column if not exists questions_today integer default 0,
  add column if not exists last_question_date date,
  add column if not exists subscription_status text default 'free',
  add column if not exists subscription_expires_at timestamp with time zone;

update profiles
set questions_today = coalesce(questions_today, 0),
    subscription_status = coalesce(subscription_status, 'free');

alter table profiles
  alter column questions_today set default 0,
  alter column subscription_status set default 'free';

-- Constrain subscription status values.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_subscription_status_check'
  ) then
    alter table profiles
      add constraint profiles_subscription_status_check
      check (subscription_status in ('free', 'premium', 'active', 'trial', 'canceled', 'expired'));
  end if;
end
$$;

-- Answer-level analytics table.
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  question_id text not null,
  selected_option text not null,
  was_correct boolean,
  answered_at timestamp with time zone default now()
);

create index if not exists idx_answers_user_id_answered_at on answers (user_id, answered_at desc);
create index if not exists idx_answers_question_id on answers (question_id);

alter table answers enable row level security;

-- Policies for answers table.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'answers'
      and policyname = 'Answers readable by owner'
  ) then
    create policy "Answers readable by owner"
      on answers
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'answers'
      and policyname = 'Answers insertable by owner'
  ) then
    create policy "Answers insertable by owner"
      on answers
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;
