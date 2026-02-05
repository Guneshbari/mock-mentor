-- Create user achievements table
-- This table tracks milestones and achievements earned by users

create table if not exists public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_type text not null, -- 'first_session', 'streak_3', 'streak_7', 'high_score', 'perfect_score', 'sessions_5', 'sessions_10', 'sessions_25', 'sessions_50'
  title text not null,
  description text not null,
  icon text, -- emoji or icon name
  earned_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Add index for faster queries
create index idx_user_achievements_user_id on public.user_achievements(user_id);
create index idx_user_achievements_earned_at on public.user_achievements(earned_at desc);

-- Enable RLS
alter table public.user_achievements enable row level security;

-- RLS Policies
create policy "Users can view own achievements" 
  on public.user_achievements for select 
  using (auth.uid() = user_id);

create policy "Users can insert own achievements" 
  on public.user_achievements for insert 
  with check (auth.uid() = user_id);

-- Prevent duplicates: unique constraint on user_id + achievement_type
create unique index unique_user_achievement 
  on public.user_achievements(user_id, achievement_type);

-- Comments for documentation
comment on table public.user_achievements is 'Stores user achievements and milestones';
comment on column public.user_achievements.achievement_type is 'Type of achievement: first_session, streak_3, high_score, etc.';
