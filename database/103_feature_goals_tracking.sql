-- Create user goals tracking table
-- This table tracks user goals and their progress over time

create table if not exists public.user_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  goal_type text not null, -- 'land_first_job', 'improve_confidence', 'master_technical', 'career_switch', etc.
  goal_name text not null,
  target_value numeric(10,2), -- target score, sessions, etc.
  current_value numeric(10,2) default 0,
  start_date timestamptz default now(),
  target_date timestamptz,
  status text check (status in ('active', 'completed', 'paused', 'abandoned')) default 'active',
  progress_percentage integer generated always as (
    case 
      when target_value > 0 then least(100, round((current_value / target_value * 100)::numeric))
      else 0
    end
  ) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for faster queries
create index idx_user_goals_user_id on public.user_goals(user_id);
create index idx_user_goals_status on public.user_goals(status);
create index idx_user_goals_user_status on public.user_goals(user_id, status);

-- Enable RLS
alter table public.user_goals enable row level security;

-- RLS Policies
create policy "Users can view own goals" 
  on public.user_goals for select 
  using (auth.uid() = user_id);

create policy "Users can insert own goals" 
  on public.user_goals for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own goals" 
  on public.user_goals for update 
  using (auth.uid() = user_id);

create policy "Users can delete own goals" 
  on public.user_goals for delete 
  using (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
create or replace function update_user_goals_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at
create trigger update_user_goals_timestamp
  before update on public.user_goals
  for each row
  execute function update_user_goals_updated_at();

-- Comments for documentation
comment on table public.user_goals is 'Tracks user goals and their progress over time';
comment on column public.user_goals.goal_type is 'Type of goal from onboarding or user-created';
comment on column public.user_goals.progress_percentage is 'Auto-calculated progress percentage (0-100)';
