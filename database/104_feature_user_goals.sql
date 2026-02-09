-- Note: user_goals table is defined in 103_feature_goals_tracking.sql
-- This file only handles user_achievements table

-- Create user_achievements table if it doesn't exist (referenced in dashboard service)
create table if not exists public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  achievement_type text not null,
  title text not null,
  description text,
  icon text,
  earned_at timestamptz default now(),
  unique(user_id, achievement_type)
);

-- Enable RLS
alter table public.user_achievements enable row level security;

-- Policies
create policy "Users can view own achievements" on public.user_achievements for select using (auth.uid() = user_id);
-- Insert is usually doing by system/service with service role, but for now allow user to insert if triggered by own action
create policy "Users can insert own achievements" on public.user_achievements for insert with check (auth.uid() = user_id); 
