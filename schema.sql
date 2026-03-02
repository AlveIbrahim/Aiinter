-- Create interviews table
create table if not exists interviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  role text not null,
  difficulty text not null,
  topic text not null,
  num_questions int not null,
  status text default 'in_progress',
  overall_score float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create interview_questions table
create table if not exists interview_questions (
  id uuid default gen_random_uuid() primary key,
  interview_id uuid references interviews(id) on delete cascade not null,
  question_order int not null,
  question text not null,
  user_answer text,
  ai_feedback text,
  score int,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table interviews enable row level security;
alter table interview_questions enable row level security;

-- Create policies for interviews
create policy "Users can view their own interviews"
  on interviews for select
  using (auth.uid() = user_id);

create policy "Users can insert their own interviews"
  on interviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own interviews"
  on interviews for update
  using (auth.uid() = user_id);

-- Create policies for interview_questions
create policy "Users can view questions for their interviews"
  on interview_questions for select
  using (
    exists (
      select 1 from interviews
      where interviews.id = interview_questions.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can insert questions for their interviews"
  on interview_questions for insert
  with check (
    exists (
      select 1 from interviews
      where interviews.id = interview_questions.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can update questions for their interviews"
  on interview_questions for update
  using (
    exists (
      select 1 from interviews
      where interviews.id = interview_questions.interview_id
      and interviews.user_id = auth.uid()
    )
  );
