/*
# Initial Schema for BoardMaster - Part 1: Tables

## Overview
Creates the core database tables for the BoardMaster task management application.

## New Tables

### 1. profiles
- Extends Supabase auth.users with additional profile information
- `id` (uuid, primary key, references auth.users)
- `email` (text, unique, not null)
- `full_name` (text, optional)
- `avatar_url` (text, optional)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 2. projects
- `id` (uuid, primary key)
- `title` (text, not null, max 100 characters)
- `description` (text, max 3000 characters)
- `color` (text, hex color code)
- `icon` (text, icon identifier)
- `owner_id` (uuid, not null, references profiles)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 3. project_members
- `id` (uuid, primary key)
- `project_id` (uuid, not null, references projects)
- `user_id` (uuid, not null, references profiles)
- `role` (enum: 'owner', 'member')
- `joined_at` (timestamptz, default now())

### 4. tasks
- `id` (uuid, primary key)
- `project_id` (uuid, not null, references projects)
- `title` (text, not null, max 100 characters)
- `description` (text, max 3000 characters)
- `status` (enum: 'todo', 'in_progress', 'review', 'done')
- `priority` (enum: 'low', 'medium', 'high', 'urgent')
- `assignee_id` (uuid, references profiles)
- `created_by` (uuid, references profiles)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- `completed_at` (timestamptz)

### 5. activity_logs
- `id` (uuid, primary key)
- `project_id` (uuid, references projects)
- `task_id` (uuid, references tasks)
- `user_id` (uuid, not null, references profiles)
- `action` (text, not null)
- `entity_type` (text)
- `entity_id` (uuid)
- `old_value` (jsonb)
- `new_value` (jsonb)
- `metadata` (jsonb)
- `created_at` (timestamptz, default now())

### 6. notifications
- `id` (uuid, primary key)
- `user_id` (uuid, not null, references profiles)
- `type` (text, not null)
- `title` (text, not null)
- `message` (text)
- `data` (jsonb)
- `is_read` (boolean, default false)
- `created_at` (timestamptz, default now())
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('owner', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL CHECK (char_length(title) <= 100),
    description text CHECK (char_length(description) <= 3000),
    color text DEFAULT '#3B82F6',
    icon text DEFAULT 'folder',
    owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    joined_at timestamptz DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title text NOT NULL CHECK (char_length(title) <= 100),
    description text CHECK (char_length(description) <= 3000),
    status task_status NOT NULL DEFAULT 'todo',
    priority task_priority NOT NULL DEFAULT 'medium',
    assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text,
    data jsonb,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task_id ON activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);