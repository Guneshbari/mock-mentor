-- Create pro tips table
-- This table stores professional interview tips that rotate on each app refresh

create table if not exists public.pro_tips (
  id uuid default uuid_generate_v4() primary key,
  tip_text text not null,
  category text check (category in ('technical', 'behavioral', 'hr', 'general')) default 'general',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add index for faster queries
create index idx_pro_tips_category on public.pro_tips(category);
create index idx_pro_tips_active on public.pro_tips(is_active) where is_active = true;

-- Enable RLS (pro tips are public - all authenticated users can read)
alter table public.pro_tips enable row level security;

-- RLS Policy - all authenticated users can read active tips
create policy "Authenticated users can view active tips" 
  on public.pro_tips for select 
  using ((SELECT auth.role()) = 'authenticated' and is_active = true);

-- Seed initial pro tips
insert into public.pro_tips (tip_text, category) values
  ('Use the STAR method (Situation, Task, Action, Result) to structure your behavioral answers.', 'behavioral'),
  ('Research the company''s recent projects and mention them during your interview.', 'general'),
  ('Prepare 2-3 questions to ask the interviewer - it shows genuine interest.', 'general'),
  ('For technical questions, think out loud to show your problem-solving process.', 'technical'),
  ('Practice common coding problems on platforms like LeetCode before your interview.', 'technical'),
  ('Maintain eye contact and good posture to project confidence.', 'behavioral'),
  ('Quantify your achievements with numbers and metrics whenever possible.', 'behavioral'),
  ('Don''t be afraid to ask clarifying questions before answering.', 'general'),
  ('Prepare examples of how you''ve handled conflict or difficult team situations.', 'behavioral'),
  ('Review your resume thoroughly - be ready to discuss everything on it.', 'general'),
  ('For salary discussions, research market rates and know your worth.', 'hr'),
  ('Dress appropriately for the company culture - when in doubt, go business casual.', 'general'),
  ('Arrive 10-15 minutes early to show punctuality and reduce stress.', 'general'),
  ('For technical interviews, consider time and space complexity in your solutions.', 'technical'),
  ('Practice your elevator pitch - a 30-second introduction about yourself.', 'general'),
  ('Turn your weaknesses into growth opportunities when discussing them.', 'behavioral'),
  ('Send a thank-you email within 24 hours after your interview.', 'general'),
  ('For remote interviews, test your tech setup 30 minutes before.', 'general'),
  ('Prepare stories that demonstrate leadership, even if you weren''t in a leadership role.', 'behavioral'),
  ('When discussing projects, focus on your specific contributions, not just the team''s work.', 'technical'),
  ('Stay positive - never badmouth previous employers or colleagues.', 'behavioral'),
  ('For HR questions about gaps in employment, be honest and brief.', 'hr'),
  ('Practice active listening - fully understand questions before answering.', 'general'),
  ('Bring a notebook and pen to take notes during the interview.', 'general'),
  ('For technical problems, start with a brute force solution, then optimize.', 'technical'),
  ('Research your interviewers on LinkedIn to find common ground.', 'general'),
  ('Prepare examples of how you''ve learned from failures or mistakes.', 'behavioral'),
  ('Know the job description inside out - tailor your answers to match.', 'general'),
  ('For system design questions, start with requirements gathering.', 'technical'),
  ('Practice your answers but don''t memorize - authenticity matters.', 'general');

-- Comments for documentation
comment on table public.pro_tips is 'Professional interview tips that rotate on app refresh';
comment on column public.pro_tips.category is 'Category: technical, behavioral, hr, or general';
