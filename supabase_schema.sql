-- Запустите этот файл в Supabase → SQL Editor

-- Включаем RLS (Row Level Security) — каждый видит только свои данные
-- Таблицы автоматически привязаны к auth.users через user_id = auth.uid()

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  balance numeric not null default 0,
  currency text not null default 'RUB',
  type text not null default 'card', -- cash | card | deposit | credit
  color text not null default '#2563EB',
  created_at timestamptz default now()
);
alter table accounts enable row level security;
create policy "own accounts" on accounts using (user_id = auth.uid());

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  type text not null, -- income | expense
  icon text not null default '📦',
  color text not null default '#6B7280',
  created_at timestamptz default now()
);
alter table categories enable row level security;
create policy "own categories" on categories using (user_id = auth.uid());

create table if not exists operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  type text not null, -- income | expense | transfer
  amount numeric not null,
  currency text not null default 'RUB',
  date timestamptz not null default now(),
  account_id uuid references accounts(id) on delete cascade,
  to_account_id uuid references accounts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  comment text,
  is_deleted boolean default false,
  created_at timestamptz default now()
);
alter table operations enable row level security;
create policy "own operations" on operations using (user_id = auth.uid());

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  category_id uuid references categories(id) on delete cascade,
  month date not null, -- первое число месяца, напр. 2026-06-01
  planned numeric not null default 0,
  created_at timestamptz default now(),
  unique(user_id, category_id, month)
);
alter table budget_items enable row level security;
create policy "own budget" on budget_items using (user_id = auth.uid());

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  title text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  deadline timestamptz,
  icon text default '🎯',
  color text default '#2563EB',
  monthly_recommendation numeric,
  created_at timestamptz default now()
);
alter table goals enable row level security;
create policy "own goals" on goals using (user_id = auth.uid());

create table if not exists profiles (
  id uuid primary key references auth.users,
  name text,
  plan text default 'free', -- free | basic | advanced | business
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "own profile" on profiles using (id = auth.uid());

-- Автоматически создаём профиль при регистрации
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
