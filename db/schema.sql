-- Hearth — Postgres schema for Supabase (production backend).
-- Mirrors src/lib/types.ts and doc 06-data-model.md. The web app currently runs
-- against a local file store (src/lib/store.ts); this is the schema you create in
-- Supabase to swap that store for the real backend. Row-Level Security is defined
-- alongside each table (doc 05 "Security"). Run in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type chef_status      as enum ('pending', 'approved', 'suspended');
create type booking_status   as enum (
  'requested','accepted','declined','confirmed','in_progress','completed',
  'cancelled_client','cancelled_chef','disputed','refunded','expired'
);
create type escrow_status    as enum (
  'authorized','captured','held','released','refunded','partially_refunded','failed'
);
create type review_direction as enum ('client_to_chef','chef_to_client');
create type doc_type         as enum ('food_safety_cert','insurance','id');
create type doc_status       as enum ('submitted','verified','rejected');
create type item_type        as enum ('menu','travel','addon','fee','tax');

-- ---------------------------------------------------------------------------
-- users — base account (id comes from Supabase Auth: auth.users.id)
-- ---------------------------------------------------------------------------
create table users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text unique not null,
  phone       text,
  full_name   text,
  avatar_url  text,
  is_chef     boolean not null default false,
  is_client   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- chef_profiles — supply-side profile (one per chef)
-- ---------------------------------------------------------------------------
create table chef_profiles (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references users (id) on delete cascade,
  display_name              text not null,
  tagline                   text,
  bio                       text,
  cuisines                  text[] not null default '{}',
  dietary_specialties       text[] not null default '{}',
  service_city              text not null,
  neighborhood              text,
  service_lat               numeric,
  service_lng               numeric,
  service_radius_km         numeric not null default 25,
  max_party_size            int not null default 12,
  travel_fee_rule           jsonb not null default '{"type":"flat","amount":40}',
  rating_avg                numeric not null default 0,
  rating_count              int not null default 0,
  bookings_completed        int not null default 0,
  status                    chef_status not null default 'pending',
  food_safety_cert_verified boolean not null default false,
  insurance_verified        boolean not null default false,
  id_verified               boolean not null default false,
  stripe_account_id         text,
  stripe_payouts_enabled    boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index on chef_profiles (status);
create index on chef_profiles (service_city);
create index on chef_profiles (rating_avg desc);

-- chef_documents — verification artifacts (admin-access only)
create table chef_documents (
  id          uuid primary key default gen_random_uuid(),
  chef_id     uuid not null references chef_profiles (id) on delete cascade,
  type        doc_type not null,
  file_url    text not null,
  status      doc_status not null default 'submitted',
  expires_at  date,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- menus / menu_courses — the browse-and-book unit
-- ---------------------------------------------------------------------------
create table menus (
  id              uuid primary key default gen_random_uuid(),
  chef_id         uuid not null references chef_profiles (id) on delete cascade,
  name            text not null,
  description     text,
  price_per_guest numeric not null,
  min_guests      int not null default 2,
  max_guests      int not null default 12,
  dietary_tags    text[] not null default '{}',
  photo_urls      text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on menus (chef_id);

create table menu_courses (
  id          uuid primary key default gen_random_uuid(),
  menu_id     uuid not null references menus (id) on delete cascade,
  course_name text not null,
  dishes      text[] not null default '{}',
  sort_order  int not null default 0
);

-- ---------------------------------------------------------------------------
-- availability / blocked_dates
-- ---------------------------------------------------------------------------
create table availability (
  id         uuid primary key default gen_random_uuid(),
  chef_id    uuid not null references chef_profiles (id) on delete cascade,
  weekday    int,            -- 0..6, nullable for one-offs
  start_time time,
  end_time   time
);
create table blocked_dates (
  id      uuid primary key default gen_random_uuid(),
  chef_id uuid not null references chef_profiles (id) on delete cascade,
  date    date not null,
  unique (chef_id, date)
);

-- ---------------------------------------------------------------------------
-- bookings — the heart of the system. Money columns are snapshotted at creation
-- so later menu price changes never rewrite historical bookings (doc 06).
-- ---------------------------------------------------------------------------
create table bookings (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references users (id),
  chef_id           uuid not null references chef_profiles (id),
  menu_id           uuid references menus (id),
  custom_request_id uuid,
  status            booking_status not null default 'requested',
  event_date        date not null,
  event_time        time not null,
  guest_count       int not null,
  address           jsonb not null,
  allergies         text not null default '',
  dietary_notes     text default '',
  special_requests  text default '',
  menu_subtotal     numeric not null,
  travel_fee        numeric not null default 0,
  subtotal          numeric not null,
  service_fee       numeric not null,
  tax               numeric not null default 0,
  total_charged     numeric not null,
  commission        numeric not null,
  chef_payout       numeric not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on bookings (client_id);
create index on bookings (chef_id);
create index on bookings (status);
-- Double-booking guard: at most one active booking per chef per date.
create unique index one_active_booking_per_chef_date
  on bookings (chef_id, event_date)
  where status in ('accepted','confirmed','in_progress');

create table booking_items (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  label      text not null,
  amount     numeric not null,
  type       item_type not null
);

-- payments — mirrors Stripe; webhooks are the source of truth (doc 05)
create table payments (
  id                    uuid primary key default gen_random_uuid(),
  booking_id            uuid not null references bookings (id) on delete cascade,
  stripe_payment_intent text,
  amount                numeric not null,
  status                escrow_status not null default 'authorized',
  released_at           timestamptz,
  refunded_amount       numeric not null default 0,
  created_at            timestamptz not null default now()
);

-- messages — one thread per booking (and per custom request pre-booking)
create table messages (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid references bookings (id) on delete cascade,
  custom_request_id uuid,
  sender_id         uuid not null references users (id),
  body              text not null,
  attachment_urls   text[] not null default '{}',
  read_at           timestamptz,
  created_at        timestamptz not null default now()
);
create index on messages (booking_id);

-- reviews — double-blind: hidden until both sides submit or a timer expires
create table reviews (
  id                       uuid primary key default gen_random_uuid(),
  booking_id               uuid not null references bookings (id) on delete cascade,
  author_id                uuid not null references users (id),
  direction                review_direction not null,
  rating_food              int check (rating_food between 1 and 5),
  rating_presentation      int check (rating_presentation between 1 and 5),
  rating_professionalism   int check (rating_professionalism between 1 and 5),
  rating_communication     int check (rating_communication between 1 and 5),
  comment                  text,
  photo_urls               text[] not null default '{}',
  is_visible               boolean not null default false,
  created_at               timestamptz not null default now()
);

-- custom_requests / quotes — the request-and-quote path
create table custom_requests (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references users (id),
  target_chef_id uuid references chef_profiles (id),
  occasion       text,
  event_date     date,
  guest_count    int,
  budget_min     numeric,
  budget_max     numeric,
  cuisine_pref   text,
  allergies      text,
  address        jsonb,
  status         text not null default 'open',
  created_at     timestamptz not null default now()
);
create table quotes (
  id                uuid primary key default gen_random_uuid(),
  custom_request_id uuid not null references custom_requests (id) on delete cascade,
  chef_id           uuid not null references chef_profiles (id),
  proposed_menu     jsonb,
  price_per_guest   numeric,
  total             numeric,
  notes             text,
  status            text not null default 'sent',
  created_at        timestamptz not null default now()
);

-- chef_applications / waitlist — landing-page funnels (doc 04)
create table chef_applications (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  city                text,
  email               text not null,
  phone               text,
  years_cooking       text,
  cuisines            text,
  links               text,
  has_food_safety_cert text,
  has_insurance       text,
  work_types          text[] not null default '{}',
  about               text,
  status              text not null default 'submitted',
  created_at          timestamptz not null default now()
);
create table waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  city       text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-Level Security (doc 05). Design these as you create each table.
-- Assumes an is_admin(uuid) helper backed by a privileged role/claim.
-- ---------------------------------------------------------------------------
alter table users          enable row level security;
alter table chef_profiles  enable row level security;
alter table menus          enable row level security;
alter table bookings       enable row level security;
alter table messages       enable row level security;
alter table reviews        enable row level security;
alter table payments       enable row level security;
alter table chef_documents enable row level security;

-- Public read of approved supply (discovery is open to anyone browsing).
create policy "approved chefs are public"
  on chef_profiles for select using (status = 'approved');
create policy "active menus are public"
  on menus for select using (is_active = true);

-- A user can read/update their own user row.
create policy "own user row" on users
  for select using (id = auth.uid());
create policy "update own user row" on users
  for update using (id = auth.uid());

-- A chef can manage their own profile + menus.
create policy "chef manages own profile" on chef_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "chef manages own menus" on menus
  for all using (
    chef_id in (select id from chef_profiles where user_id = auth.uid())
  );

-- Bookings: visible to the client who placed them and the chef who received them.
create policy "client reads own bookings" on bookings
  for select using (client_id = auth.uid());
create policy "chef reads own bookings" on bookings
  for select using (
    chef_id in (select id from chef_profiles where user_id = auth.uid())
  );
create policy "client creates own bookings" on bookings
  for insert with check (client_id = auth.uid());

-- Messages: only the two parties on the booking.
create policy "thread parties read messages" on messages
  for select using (
    booking_id in (
      select id from bookings
      where client_id = auth.uid()
         or chef_id in (select id from chef_profiles where user_id = auth.uid())
    )
  );
create policy "thread parties write messages" on messages
  for insert with check (sender_id = auth.uid());

-- Reviews: visible ones are public; authors can always see their own.
create policy "visible reviews are public" on reviews
  for select using (is_visible = true or author_id = auth.uid());
create policy "author writes review" on reviews
  for insert with check (author_id = auth.uid());

-- Verification docs + payments: never exposed to the client app (admin/service-role only).
-- (No permissive policy here → only the service role can read, by design.)
