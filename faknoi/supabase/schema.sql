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

-- New columns for location pins, estimated delivery time, and purchase photo
alter table public.trips add column if not exists origin_lat numeric(10,7);
alter table public.trips add column if not exists origin_lng numeric(10,7);
alter table public.trips add column if not exists destination_lat numeric(10,7);
alter table public.trips add column if not exists destination_lng numeric(10,7);
alter table public.trips add column if not exists estimated_delivery_time timestamptz;

-- Column for purchase proof photo on orders
alter table public.orders add column if not exists purchase_photo_url text;

-- ===== Admin system =====

-- Mark admin by role in profiles
alter table public.profiles add column if not exists role text default 'user' check (role in ('user','admin'));

-- Area status table (per university)
create table if not exists public.area_status (
  id uuid default uuid_generate_v4() primary key,
  university_id text not null unique,
  is_open boolean default true,
  note text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

-- Admin actions log (for notifications to users)
create table if not exists public.admin_actions (
  id uuid default uuid_generate_v4() primary key,
  target_user_id uuid references public.profiles(id) on delete cascade,
  action_type text not null, -- 'cancel_trip','delete_trip','cancel_order', etc.
  note text,
  admin_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  seen boolean default false
);

-- Add rejected status and note to payment_slips
alter table public.payment_slips add column if not exists rejected_note text;
alter table public.payment_slips add column if not exists amount_verified numeric(10,2);
alter table public.payment_slips add column if not exists verified_note text;

-- RLS for new tables
alter table public.area_status enable row level security;
alter table public.admin_actions enable row level security;

create policy "area_status_select" on public.area_status for select using (true);
create policy "area_status_admin" on public.area_status for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "admin_actions_select" on public.admin_actions for select
  using (target_user_id = auth.uid() or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
create policy "admin_actions_insert" on public.admin_actions for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "admin_actions_update" on public.admin_actions for update
  using (target_user_id = auth.uid());

-- report_messages table (for admin <-> user chat on reports)
create table if not exists public.report_messages (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamptz default now()
);

alter table public.report_messages enable row level security;

create policy "report_messages_select" on public.report_messages for select
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and (r.user_id = auth.uid() or exists (
          select 1 from public.profiles where id = auth.uid() and role = 'admin'
        ))
    )
  );

create policy "report_messages_insert" on public.report_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and (r.user_id = auth.uid() or exists (
          select 1 from public.profiles where id = auth.uid() and role = 'admin'
        ))
    )
  );

-- Add university_id to payment_slips and reports for filtering
alter table public.payment_slips add column if not exists university_id text;
alter table public.reports add column if not exists university_id text;

-- Set role = 'admin' for username 'admin'
update public.profiles set role = 'admin' where username = 'admin';

-- Messages table (order chat)
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text,
  image_url text,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "messages_select" on public.messages for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or
             exists (select 1 from public.trips t where t.id = o.trip_id and t.shopper_id = auth.uid()))
    )
  );

create policy "messages_insert" on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or
             exists (select 1 from public.trips t where t.id = o.trip_id and t.shopper_id = auth.uid()))
    )
  );

-- Add image_url column if messages table already exists
alter table public.messages add column if not exists image_url text;

-- Storage bucket for chat images (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', true);
-- create policy "chat_images_select" on storage.objects for select using (bucket_id = 'chat-images');
-- create policy "chat_images_insert" on storage.objects for insert with check (bucket_id = 'chat-images' and auth.role() = 'authenticated');
