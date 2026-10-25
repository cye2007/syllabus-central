create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null default 'Untitled course',
  code text,
  term text,
  color text not null default 'blue',
  status text not null default 'processing',
  error text,
  file_name text,
  syllabus_path text,
  overview jsonb not null default '{}'::jsonb,
  grading jsonb not null default '{}'::jsonb,
  policies jsonb not null default '[]'::jsonb,
  resources jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "own courses" on public.courses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.course_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  kind text not null default 'assignment',
  due_date date,
  due_text text,
  weight numeric,
  description text,
  source_page int,
  edited boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.course_items to authenticated;
grant all on public.course_items to service_role;
alter table public.course_items enable row level security;
create policy "own items" on public.course_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.course_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  kind text not null default 'unclear',
  title text not null,
  description text,
  sources jsonb not null default '[]'::jsonb,
  status text not null default 'open',
  resolution text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.course_issues to authenticated;
grant all on public.course_issues to service_role;
alter table public.course_issues enable row level security;
create policy "own issues" on public.course_issues for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own syllabi read" on storage.objects for select to authenticated using (bucket_id = 'syllabi' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own syllabi insert" on storage.objects for insert to authenticated with check (bucket_id = 'syllabi' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own syllabi delete" on storage.objects for delete to authenticated using (bucket_id = 'syllabi' and (storage.foldername(name))[1] = auth.uid()::text);