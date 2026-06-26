-- Hearth — representative Supabase seed (the supply-first launch cohort, doc 04).
-- The canonical, full seed used by the running web app lives in src/lib/seed.ts.
-- This file shows the SQL shape for seeding the real Postgres backend; expand it
-- to the full cohort when you migrate off the local store.
--
-- NOTE: in production `users.id` references auth.users, so create the auth users
-- first (or relax the FK while seeding demo data).

insert into chef_profiles
  (id, user_id, display_name, tagline, bio, cuisines, dietary_specialties,
   service_city, neighborhood, service_radius_km, max_party_size,
   travel_fee_rule, rating_avg, rating_count, bookings_completed, status,
   food_safety_cert_verified, insurance_verified, id_verified,
   stripe_account_id, stripe_payouts_enabled)
values
  ('00000000-0000-0000-0000-0000000000a1',
   '00000000-0000-0000-0000-0000000000u1',
   'Ana Reyes',
   'Coastal Italian & Mediterranean, cooked in your kitchen',
   'Fifteen years across kitchens in Naples, Barcelona and Austin…',
   '{Italian,Mediterranean,Seafood}', '{Pescatarian}',
   'Austin', 'East Austin', 30, 14,
   '{"type":"flat","amount":40}', 4.9, 32, 34, 'approved',
   true, true, true, 'acct_demo_ana', true);

insert into menus
  (id, chef_id, name, description, price_per_guest, min_guests, max_guests,
   dietary_tags, is_active)
values
  ('00000000-0000-0000-0000-0000000000m1',
   '00000000-0000-0000-0000-0000000000a1',
   'Coastal Italian Dinner',
   'A four-course seafood-forward menu inspired by the Amalfi coast.',
   120, 4, 12, '{Pescatarian}', true);

insert into menu_courses (menu_id, course_name, dishes, sort_order) values
  ('00000000-0000-0000-0000-0000000000m1', 'Antipasti', '{"Marinated olives & focaccia","Burrata with summer tomato & basil"}', 0),
  ('00000000-0000-0000-0000-0000000000m1', 'Primi',     '{"Spaghetti alle vongole","Saffron risotto with prawns"}', 1),
  ('00000000-0000-0000-0000-0000000000m1', 'Secondi',   '{"Whole branzino, lemon & herbs"}', 2),
  ('00000000-0000-0000-0000-0000000000m1', 'Dolci',     '{"Lemon olive-oil cake"}', 3);
