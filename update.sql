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

/* NOTE:
   - Passwords cannot be set securely via plain SQL in Supabase.
   - After running this script, set passwords for these users via the Supabase dashboard or the Admin API/CLI
     (e.g., supabase auth admin create-user ...) to match your UI presets. */

-- Create app-side users table if missing
CREATE TABLE IF NOT EXISTS users (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "fullName" TEXT,
  "role" TEXT CHECK (role IN ('admin', 'owner', 'maintenance', 'renter')) DEFAULT 'renter',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public users access" ON users FOR ALL USING (true);
