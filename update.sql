-- Idempotent update script to align Supabase tables with the latest schema.
-- Run in the SQL editor once. Safe to re-run (uses IF NOT EXISTS and policy guards).

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  starttime TIME,
  endtime TIME,
  color TEXT CHECK (color = ANY (ARRAY['blue','green','orange','purple'])),
  duration TEXT,
  createdat TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT CHECK (status = ANY (ARRAY['new','contacted','qualified','lost'])),
  source TEXT,
  notes TEXT,
  lastcontact TIMESTAMPTZ DEFAULT now(),
  createdat TIMESTAMPTZ DEFAULT now()
);

-- Listings
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image_urls TEXT[] DEFAULT '{}'::text[],
  energy_class TEXT,
  type TEXT CHECK (type = ANY (ARRAY['apartment','house','studio','villa','loft'])),
  size NUMERIC,
  description TEXT,
  bedrooms NUMERIC,
  pets_allowed BOOLEAN DEFAULT false,
  coordinates JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Maintenance Requests
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  property_name TEXT,
  status TEXT DEFAULT 'open' CHECK (status = ANY (ARRAY['open','pending','resolved'])),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  read BOOLEAN DEFAULT false,
  starred BOOLEAN DEFAULT false
);

-- Properties
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  price NUMERIC,
  type TEXT CHECK (type = ANY (ARRAY['apartment','house','villa','commercial','land'])),
  bedrooms INTEGER,
  bathrooms INTEGER,
  size NUMERIC,
  status TEXT CHECK (status = ANY (ARRAY['active','pending','sold','rented'])),
  images TEXT[] DEFAULT '{}'::text[],
  createdat TIMESTAMPTZ DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duedate TIMESTAMPTZ,
  priority TEXT CHECK (priority = ANY (ARRAY['low','medium','high','urgent'])),
  category TEXT,
  completed BOOLEAN DEFAULT false,
  completedat TIMESTAMPTZ,
  createdat TIMESTAMPTZ DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  type TEXT CHECK (type = ANY (ARRAY['income','expense'])),
  category TEXT,
  amount NUMERIC NOT NULL,
  method TEXT,
  reference TEXT,
  createdat TIMESTAMPTZ DEFAULT now()
);

-- User profiles tied to auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'tenant' CHECK (role = ANY (ARRAY['admin','contractor','owner','broker','tenant'])),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- App-side users (if needed separately)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  name TEXT,
  role TEXT DEFAULT 'tenant' CHECK (role = ANY (ARRAY['admin','contractor','owner','broker','tenant'])),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Keep public.user_profiles and public.users aligned with auth.users
-- Notes:
-- - auth.users does not have a "role" column; custom fields live in raw_user_meta_data.
-- - We map app-ish values (maintenance/renter) into DB enum values (contractor/tenant).
CREATE OR REPLACE FUNCTION public.handle_auth_user_upsert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_role text;
  db_role text;
  meta_full_name text;
BEGIN
  meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  db_role := CASE lower(meta_role)
    WHEN 'maintenance' THEN 'contractor'
    WHEN 'contractor' THEN 'contractor'
    WHEN 'renter' THEN 'tenant'
    WHEN 'tenant' THEN 'tenant'
    WHEN 'broker' THEN 'broker'
    WHEN 'agent' THEN 'admin'
    WHEN 'admin' THEN 'admin'
    WHEN 'owner' THEN 'owner'
    ELSE 'tenant'
  END;

  meta_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    NEW.raw_user_meta_data->>'name',
    NULL
  );

  INSERT INTO public.user_profiles (id, email, full_name, role, created_at)
  VALUES (NEW.id, NEW.email, meta_full_name, db_role, timezone('utc', now()))
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    role = COALESCE(EXCLUDED.role, public.user_profiles.role);

  INSERT INTO public.users (id, email, full_name, name, role, created_at)
  VALUES (NEW.id, NEW.email, meta_full_name, meta_full_name, db_role, timezone('utc', now()))
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    name = COALESCE(EXCLUDED.name, public.users.name),
    role = COALESCE(EXCLUDED.role, public.users.role);

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_upsert') THEN
    CREATE TRIGGER on_auth_user_upsert
    AFTER INSERT OR UPDATE OF email, raw_user_meta_data
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_upsert();
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Seed app-side users if auth entry exists (avoids FK errors if auth.users missing)
INSERT INTO public.users (id, email, full_name, name, role, created_at)
SELECT v.id, v.email, v.full_name, v.name, v.role, v.created_at
FROM (
  VALUES
    ('1e2c3e70-5f9c-4c12-93b5-d8c8cc35a0b7'::uuid, 'aaptuha@gmail.com', 'Test', 'Test', 'tenant', '2025-12-03 08:33:26.266345+00'::timestamptz),
    ('84168b53-fb1b-4936-a1d3-21e181bb9bff'::uuid, 'demo@eburon.ai', 'Emil Alvaro Danguilan', 'Emil Alvaro Danguilan', 'tenant', '2025-11-27 11:28:08.736581+00'::timestamptz),
    ('9fd4eaa3-0e25-4b7a-bb07-5b4c37cf90f8'::uuid, 'master@eburon.ai', 'Emil Alvaro Danguilan', 'Emil Alvaro Danguilan', 'tenant', '2025-11-27 14:37:02.943354+00'::timestamptz),
    ('c68bda81-9c09-449f-8b92-b763c4b096f2'::uuid, 'tenant@gmail.com', 'Tenant', 'Tenant', 'tenant', '2025-12-03 10:26:47.369471+00'::timestamptz),
    ('dc99c1c8-d0d5-4c76-9c56-8a456f44b938'::uuid, 'develop@eburon.ai', 'Emil Alvaro Serrano Danguilan', 'Emil Alvaro Serrano Danguilan', 'tenant', '2025-12-03 04:04:14.455632+00'::timestamptz)
) AS v(id, email, full_name, name, role, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = v.id)
  AND EXISTS (SELECT 1 FROM auth.users a WHERE a.id = v.id);

-- Seed admin@eburon.ai into app users if the auth user exists (derives id from auth.users)
INSERT INTO public.users (id, email, full_name, name, role, created_at)
SELECT a.id, a.email, COALESCE(a.raw_user_meta_data->>'full_name', 'Admin'), 'Admin', 'admin', timezone('utc', now())
FROM auth.users a
WHERE a.email = 'admin@eburon.ai'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.id);

-- Permissive policies (adjust for production)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='Public events access') THEN
    CREATE POLICY "Public events access" ON public.events FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leads' AND policyname='Public leads access') THEN
    CREATE POLICY "Public leads access" ON public.leads FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='listings' AND policyname='Public listings access') THEN
    CREATE POLICY "Public listings access" ON public.listings FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='maintenance_requests' AND policyname='Public maintenance_requests access') THEN
    CREATE POLICY "Public maintenance_requests access" ON public.maintenance_requests FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Public messages access') THEN
    CREATE POLICY "Public messages access" ON public.messages FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='properties' AND policyname='Public properties access') THEN
    CREATE POLICY "Public properties access" ON public.properties FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks' AND policyname='Public tasks access') THEN
    CREATE POLICY "Public tasks access" ON public.tasks FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='Public transactions access') THEN
    CREATE POLICY "Public transactions access" ON public.transactions FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_profiles' AND policyname='Public user_profiles access') THEN
    CREATE POLICY "Public user_profiles access" ON public.user_profiles FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='Public users access') THEN
    CREATE POLICY "Public users access" ON public.users FOR ALL USING (true);
  END IF;
END$$;
