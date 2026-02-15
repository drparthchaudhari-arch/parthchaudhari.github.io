# Supabase Setup Guide

## Step 1: Create Project

- supabase.com -> New Project -> Free Tier
- Choose region closest to users
- Save database password

## Step 2: Run SQL

Go to SQL Editor and run:

```sql
create table profiles (
  id uuid references auth.users on delete cascade,
  email text unique not null,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

create table user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  case_completions jsonb default '{}'::jsonb,
  study_plan jsonb default '{}'::jsonb,
  game_activity jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_progress unique (user_id)
);

create table leaderboard (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  display_name text not null,
  weekly_score integer default 0,
  current_streak integer default 0,
  total_completions integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table user_progress enable row level security;
alter table leaderboard enable row level security;

-- Policies
create policy "Users can read own profile" on profiles for select using ( auth.uid() = id );
create policy "Users can insert own profile" on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile" on profiles for update using ( auth.uid() = id );
create policy "Users can read own progress" on user_progress for select using ( auth.uid() = user_id );
create policy "Users can upsert own progress" on user_progress for all using ( auth.uid() = user_id );
create policy "Leaderboard readable by all" on leaderboard for select to anon, authenticated using ( true );
create policy "Users can update own leaderboard" on leaderboard for all using ( auth.uid() = user_id );
```

### Phase 7 NAVLE Freemium Schema

Run `supabase/migrations/20260213_navle_freemium.sql` after the base schema above. It adds:

- `profiles.questions_today`
- `profiles.last_question_date`
- `profiles.subscription_status`
- `profiles.subscription_expires_at`
- `answers` table for per-question analytics (with RLS policies)

### RLS hotfix for sync/profile writes

If you see `new row violates row-level security policy for table "profiles"`, run:

- `supabase/migrations/20260213_sync_rls_hotfix.sql`

### Foreign key error on user_progress

If you see:

- `insert or update on table "user_progress" violates foreign key constraint "user_progress_user_id_fkey"`

It means `user_progress.user_id` is being written before a matching `profiles.id` row exists.

Fix:

1. Run `supabase/migrations/20260213_sync_rls_hotfix.sql` to ensure `profiles` insert policy exists.
2. Ensure the user has a profile row (created automatically by app sync once policy is correct).
3. Retry Sync.

### Recommended hardening (one-time)

Run:

- `supabase/migrations/20260213_profile_autoprovision.sql`
- `supabase/migrations/20260215_account_deletion_and_consent.sql`

This adds an `auth.users` trigger that auto-creates/updates `profiles` rows, which prevents future `user_progress_user_id_fkey` sync failures.
The 20260215 migration also adds:

- `delete_my_account()` RPC for hard account deletion
- `record_user_consent()` RPC + `user_consents` table for consent proof logging

## Step 3: Configure Auth

- Authentication -> Providers -> Enable Email
- Turn OFF "Confirm email" (optional)
- Site URL: `https://parthchaudhari.com`
- Redirect URLs: `https://parthchaudhari.com/account/`
  - `https://parthchaudhari.com/study/navle/practice/`

## Step 4: Configure CORS

- API -> Settings -> Add your domain:
  - `https://parthchaudhari.com`
  - `https://www.parthchaudhari.com`

## Step 5: Get Keys

- Project Settings -> API
- Copy URL and anon key
- Paste into `window.SUPABASE_CONFIG` on your site, for example in a small script loaded before `assets/js/supabase-config.js`:

```html
<script>
  window.SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
  }
</script>
```

## Optional: Put config directly in `assets/js/supabase-config.js`

```js
window.SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key',
}
```
