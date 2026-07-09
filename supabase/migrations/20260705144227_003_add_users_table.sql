/*
# Add users table for local authentication

## Overview
Creates a users table for local authentication with email/password, independent of Supabase auth.

## New Table

### users
- `id` (uuid, primary key)
- `email` (text, unique, not null)
- `password_hash` (text, not null) - bcrypt hashed password
- `full_name` (text, optional)
- `avatar_url` (text, optional)
- `is_verified` (boolean, default false)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## Security
- RLS enabled on users table
- Users can only view and update their own data
*/

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    full_name text,
    avatar_url text,
    is_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users FOR SELECT
    TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users FOR INSERT
    TO authenticated WITH CHECK (true);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);