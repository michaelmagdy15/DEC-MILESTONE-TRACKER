-- Supabase Migration: Create office_expenses table

-- Create office_expenses table
create table public.office_expenses (
  id uuid default gen_random_uuid() primary key,
  location text not null check (location in ('Abu Dhabi', 'Cairo')),
  category text not null,
  amount numeric not null,
  currency text not null check (currency in ('AED', 'EGP')),
  description text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table public.office_expenses enable row level security;

-- Admins can read all office expenses
create policy "Admins can view all office expenses"
  on public.office_expenses for select
  using ( is_admin() );

-- Admins can insert office expenses
create policy "Admins can insert office expenses"
  on public.office_expenses for insert
  with check ( is_admin() );

-- Admins can update office expenses
create policy "Admins can update office expenses"
  on public.office_expenses for update
  using ( is_admin() );

-- Admins can delete office expenses
create policy "Admins can delete office expenses"
  on public.office_expenses for delete
  using ( is_admin() );
