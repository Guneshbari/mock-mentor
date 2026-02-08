-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS (Public profile syncing with auth.users is best practice)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text,
  auth_provider text, -- 'email', 'google', 'github'
  profile_image_url text,
  email_verified boolean default false,
  is_active boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now()
);

-- Trigger to create public user record on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, profile_image_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. USER PREFERENCES
create table public.user_preferences (
  user_id uuid references public.users(id) on delete cascade primary key,
  preferred_role text,
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  interview_type text, -- 'technical', 'behavioral', 'hr'
  updated_at timestamptz default now()
);

-- 2.5. ONBOARDING RESPONSES (Store user onboarding selections)
create table public.onboarding_responses (
  user_id uuid references public.users(id) on delete cascade primary key,
  profile_types text[], -- e.g., ['Student', 'Recent Graduate']
  experience_years text, -- e.g., '0-1 years', '1-3 years'
  goals text[], -- e.g., ['Land First Job', 'Improve Confidence']
  completed_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. SKILLS
create table public.skills (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text,
  created_at timestamptz default now()
);

-- USER SKILLS
create table public.user_skills (
  user_id uuid references public.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  confidence_level integer check (confidence_level between 1 and 10),
  primary key (user_id, skill_id)
);

-- 4. SESSIONS (Mock Sessions)
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  session_type text check (session_type in ('mock_interview', 'mentoring')),
  skill_focus text,
  difficulty text,
  status text check (status in ('in_progress', 'completed', 'abandoned')) default 'in_progress',
  started_at timestamptz default now(),
  ended_at timestamptz,
  final_report jsonb,      -- Store the complete JSON report
  overall_score integer,    -- Store overall score for quick sorting/filtering
  updated_at timestamptz default now()
);

-- 5. SESSION QUESTIONS
create table public.session_questions (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  question_text text not null,
  question_type text, -- 'technical', 'behavioral'
  order_index integer,
  created_at timestamptz default now()
);

-- 6. USER RESPONSES
create table public.responses (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  question_id uuid references public.session_questions(id) on delete cascade,
  response_text text,
  response_duration integer, -- in seconds
  submitted_at timestamptz default now()
);

-- 7. FEEDBACK / EVALUATION
create table public.feedback (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  question_id uuid references public.session_questions(id) on delete cascade,
  strengths text[],
  improvements text[],
  score integer check (score between 0 and 100),
  confidence_score integer,
  created_at timestamptz default now()
);

-- 8. USER PROGRESS (Aggregated)
create table public.user_progress (
  user_id uuid references public.users(id) on delete cascade primary key,
  total_sessions integer default 0,
  average_score numeric(5,2) default 0.00,
  best_skill text,
  last_session_at timestamptz,
  updated_at timestamptz default now()
);

-- 9. USER ACTIVITY (Audit)
create table public.user_activity (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  action text not null, -- 'login', 'session_start', 'session_end'
  ip_address text,
  timestamp timestamptz default now()
);

-- Enable Row Level Security (RLS) on all tables (Standard Practice)
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.responses enable row level security;
alter table public.feedback enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_activity enable row level security;

-- Basic Policies (Users can only read/write their own data)
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

create policy "Users can view own preferences" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences" on public.user_preferences for update using (auth.uid() = user_id);

create policy "Users can view own onboarding" on public.onboarding_responses for select using (auth.uid() = user_id);
create policy "Users can insert own onboarding" on public.onboarding_responses for insert with check (auth.uid() = user_id);
create policy "Users can update own onboarding" on public.onboarding_responses for update using (auth.uid() = user_id);

create policy "Users can view sessions" on public.sessions for select using (auth.uid() = user_id);
create policy "Users can insert sessions" on public.sessions for insert with check (auth.uid() = user_id);
create policy "Users can update sessions" on public.sessions for update using (auth.uid() = user_id);

-- (Add similar policies for other tables as needed)
