-- Enable UUID generation (pgcrypto is available by default in Supabase, add it explicitly for clarity)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "status" TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'lost')),
  "source" TEXT,
  "notes" TEXT,
  "lastContact" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "sender" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT,
  "date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "read" BOOLEAN DEFAULT FALSE,
  "starred" BOOLEAN DEFAULT FALSE
);

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "price" NUMERIC,
  "type" TEXT CHECK (type IN ('apartment', 'house', 'villa', 'commercial', 'land')),
  "bedrooms" INTEGER,
  "bathrooms" INTEGER,
  "size" NUMERIC,
  "status" TEXT CHECK (status IN ('active', 'pending', 'sold', 'rented')),
  "images" TEXT[] DEFAULT '{}'::text[],
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP WITH TIME ZONE,
  "priority" TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  "category" TEXT,
  "completed" BOOLEAN DEFAULT FALSE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events Table (renamed from events to avoid keyword conflicts if any, though events is usually safe, keeping it simple as 'events' for now but mapping to CalendarEvent type)
CREATE TABLE IF NOT EXISTS events (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" DATE,
  "startTime" TIME,
  "endTime" TIME,
  "color" TEXT CHECK (color IN ('blue', 'green', 'orange', 'purple')),
  "duration" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "date" DATE DEFAULT CURRENT_DATE,
  "description" TEXT NOT NULL,
  "type" TEXT CHECK (type IN ('income', 'expense')),
  "category" TEXT,
  "amount" NUMERIC NOT NULL,
  "method" TEXT,
  "reference" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (app-side profile/role reference; Auth remains in auth.users)
CREATE TABLE IF NOT EXISTS users (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "fullName" TEXT,
  "role" TEXT CHECK (role IN ('admin', 'owner', 'maintenance', 'renter')) DEFAULT 'renter',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public access for demo purposes, strictly speaking should be authenticated)
-- Allow public access for now as per "make it deployable" without full auth system implementation context
CREATE POLICY "Public leads access" ON leads FOR ALL USING (true);
CREATE POLICY "Public messages access" ON messages FOR ALL USING (true);
CREATE POLICY "Public properties access" ON properties FOR ALL USING (true);
CREATE POLICY "Public tasks access" ON tasks FOR ALL USING (true);
CREATE POLICY "Public events access" ON events FOR ALL USING (true);
CREATE POLICY "Public transactions access" ON transactions FOR ALL USING (true);
CREATE POLICY "Public users access" ON users FOR ALL USING (true);
