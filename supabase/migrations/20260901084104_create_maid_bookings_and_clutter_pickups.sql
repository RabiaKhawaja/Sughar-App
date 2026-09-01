/*
# Create maid_bookings and clutter_pickups tables (single-tenant, no auth)

## Overview
Creates two core tables for the Sughar home management app:
1. `maid_bookings` — stores maid service booking requests with dynamic pricing
2. `clutter_pickups` — stores recycling pickup requests with item categories and AI valuation

## New Tables

### maid_bookings
- `id` (uuid, primary key)
- `customer_name` (text, not null) — name of the person booking
- `phone` (text, not null) — contact phone number
- `address` (text, not null) — service address
- `service_type` (text, not null) — type of cleaning (e.g. deep_clean, regular, dishwashing, laundry)
- `rooms` (int, default 1) — number of rooms to clean
- `bathrooms` (int, default 1) — number of bathrooms
- `hours` (int, default 4) — number of service hours
- `frequency` (text, default 'one_time') — one_time, weekly, bi_weekly, monthly
- `date` (date, not null) — requested service date
- `time_slot` (text, not null) — preferred time slot
- `total_price` (numeric, default 0) — computed dynamic price in PKR
- `status` (text, default 'pending') — pending, confirmed, completed, cancelled
- `created_at` (timestamptz, default now())

### clutter_pickups
- `id` (uuid, primary key)
- `customer_name` (text, not null)
- `phone` (text, not null)
- `address` (text, not null)
- `categories` (jsonb, default '[]') — array of selected category objects with name, quantity, estimated_value
- `pickup_date` (date, not null)
- `pickup_slot` (text, not null) — preferred time slot
- `total_value` (numeric, default 0) — total estimated recycling value in PKR
- `ai_summary` (text) — AI-generated eco impact summary
- `co2_saved_kg` (numeric, default 0) — estimated CO2 saved in kg
- `items_count` (int, default 0) — total number of items
- `status` (text, default 'scheduled') — scheduled, picked_up, processed, cancelled
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on both tables.
- Both are single-tenant (no auth screen), so policies allow anon + authenticated CRUD.
- USING (true) is acceptable because the app intentionally shares all booking/pickup data.
*/

CREATE TABLE IF NOT EXISTS maid_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  service_type text NOT NULL DEFAULT 'regular',
  rooms int NOT NULL DEFAULT 1,
  bathrooms int NOT NULL DEFAULT 1,
  hours int NOT NULL DEFAULT 4,
  frequency text NOT NULL DEFAULT 'one_time',
  date date NOT NULL,
  time_slot text NOT NULL,
  total_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maid_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_maid_bookings" ON maid_bookings;
CREATE POLICY "anon_select_maid_bookings" ON maid_bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_maid_bookings" ON maid_bookings;
CREATE POLICY "anon_insert_maid_bookings" ON maid_bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_maid_bookings" ON maid_bookings;
CREATE POLICY "anon_update_maid_bookings" ON maid_bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_maid_bookings" ON maid_bookings;
CREATE POLICY "anon_delete_maid_bookings" ON maid_bookings FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS clutter_pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  pickup_date date NOT NULL,
  pickup_slot text NOT NULL,
  total_value numeric NOT NULL DEFAULT 0,
  ai_summary text,
  co2_saved_kg numeric NOT NULL DEFAULT 0,
  items_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clutter_pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_clutter_pickups" ON clutter_pickups;
CREATE POLICY "anon_select_clutter_pickups" ON clutter_pickups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_clutter_pickups" ON clutter_pickups;
CREATE POLICY "anon_insert_clutter_pickups" ON clutter_pickups FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_clutter_pickups" ON clutter_pickups;
CREATE POLICY "anon_update_clutter_pickups" ON clutter_pickups FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_clutter_pickups" ON clutter_pickups;
CREATE POLICY "anon_delete_clutter_pickups" ON clutter_pickups FOR DELETE
  TO anon, authenticated USING (true);
