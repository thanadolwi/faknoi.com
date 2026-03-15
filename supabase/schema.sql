-- เพิ่ม columns ใหม่สำหรับ FakNoi features
alter table public.trips add column if not exists university_id text;
alter table public.trips add column if not exists fee_per_item numeric(10,2) default 0;
alter table public.trips add column if not exists payment_info text;
alter table public.orders add column if not exists shopper_accepted boolean default false;
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  email text not null,
  student_id text,
  role text default 'buyer' check (role in ('buyer', 'shopper')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trips table
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  shopper_id uuid references public.profiles(id) on delete cascade not null,
  origin_zone text not null,
  destination_zone text not null,
  cutoff_time timestamptz not null,
  max_orders int default 5 check (max_orders > 0),
  current_orders int default 0,
  status text default 'open' check (status in ('open','shopping','delivering','completed','cancelled')),
  note text,
  created_at timestamptz default now(),
  closed_at timestamptz
);

-- Orders table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  items jsonb not null default '[]',
  estimated_price numeric(10,2) default 0,
  final_price numeric(10,2),
  adjustment_reason text,
  status text default 'pending' check (status in ('pending','accepted','bought','delivering','completed','cancelled')),
  payment_slip_url text,
  payment_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Increment trip orders function
create or replace function public.increment_trip_orders(trip_id uuid)
returns void as $$
  update public.trips set current_orders = current_orders + 1 where id = trip_id;
$$ language sql security definer;

-- Decrement trip orders function
create or replace function public.decrement_trip_orders(trip_id uuid)
returns void as $$
  update public.trips set current_orders = greatest(current_orders - 1, 0) where id = trip_id;
$$ language sql security definer;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.orders enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Trips: anyone authenticated can read, only shopper can insert/update
create policy "trips_select" on public.trips for select using (auth.role() = 'authenticated');
create policy "trips_insert" on public.trips for insert with check (auth.uid() = shopper_id);
create policy "trips_update" on public.trips for update using (auth.uid() = shopper_id);

-- Orders: buyer and shopper of the trip can read
create policy "orders_select" on public.orders for select
  using (
    auth.uid() = buyer_id or
    auth.uid() = (select shopper_id from public.trips where id = trip_id)
  );
create policy "orders_insert" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "orders_update" on public.orders for update
  using (
    auth.uid() = buyer_id or
    auth.uid() = (select shopper_id from public.trips where id = trip_id)
  );
