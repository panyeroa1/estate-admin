-- Incremental update for Supabase schema
-- Adds image support to properties listings to align with UI upload/preview

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[];

-- Seed demo users (passwords are placeholders; update to secure values)
INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@eburon.ai', jsonb_build_object('role', 'admin'), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'owner@eburon.ai', jsonb_build_object('role', 'owner'), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'maintenance@eburon.ai', jsonb_build_object('role', 'maintenance'), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'renter@eburon.ai', jsonb_build_object('role', 'renter'), NOW())
ON CONFLICT (id) DO NOTHING;

-- NOTE: To set passwords in Supabase, you must use the auth admin API or the dashboard.
-- Alternatively, insert into auth.identities with bcrypt hashes. For quick setup via SQL:
-- 1) In the dashboard, create these users manually with the desired password (e.g., 000000).
-- 2) Or use Supabase CLI/Admin API: `supabase auth sign up --email ... --password ...`
