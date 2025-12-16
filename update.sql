-- Incremental update for Supabase schema
-- Adds image support to properties listings to align with UI upload/preview

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[];
