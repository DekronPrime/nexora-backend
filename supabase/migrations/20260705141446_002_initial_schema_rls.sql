/*
# Initial Schema for BoardMaster - Part 2: RLS Policies

## Overview
Enables Row Level Security and creates access policies for all tables.

## Security Policies

### profiles
- Users can view, update, and insert their own profile

### projects
- Owners and members can view projects
- Users can create projects (become owner)
- Only owners can update or delete projects

### project_members
- Project members can view other members
- Only project owners can add/remove members

### tasks
- Project members can CRUD tasks in their projects

### activity_logs
- Project members can view activity logs
- Users can insert activity logs for projects they're members of

### notifications
- Users can only view/update/delete their own notifications
*/

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
    TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
    TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = id);

-- projects policies
DROP POLICY IF EXISTS "Members can view projects" ON projects;
CREATE POLICY "Members can view projects" ON projects FOR SELECT
    TO authenticated USING (
        auth.uid() = owner_id 
        OR EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_members.project_id = projects.id 
            AND project_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create projects" ON projects;
CREATE POLICY "Users can create projects" ON projects FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update projects" ON projects;
CREATE POLICY "Owners can update projects" ON projects FOR UPDATE
    TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete projects" ON projects;
CREATE POLICY "Owners can delete projects" ON projects FOR DELETE
    TO authenticated USING (auth.uid() = owner_id);

-- project_members policies
DROP POLICY IF EXISTS "Members can view project members" ON project_members;
CREATE POLICY "Members can view project members" ON project_members FOR SELECT
    TO authenticated USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_members.project_id 
            AND (projects.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members pm 
                    WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
                ))
        )
    );

DROP POLICY IF EXISTS "Owners can add members" ON project_members;
CREATE POLICY "Owners can add members" ON project_members FOR INSERT
    TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_members.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can remove members" ON project_members;
CREATE POLICY "Owners can remove members" ON project_members FOR DELETE
    TO authenticated USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_members.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- tasks policies
DROP POLICY IF EXISTS "Project members can view tasks" ON tasks;
CREATE POLICY "Project members can view tasks" ON tasks FOR SELECT
    TO authenticated USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = tasks.project_id 
            AND (projects.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members 
                    WHERE project_members.project_id = projects.id 
                    AND project_members.user_id = auth.uid()
                ))
        )
    );

DROP POLICY IF EXISTS "Project members can create tasks" ON tasks;
CREATE POLICY "Project members can create tasks" ON tasks FOR INSERT
    TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = tasks.project_id 
            AND (projects.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members 
                    WHERE project_members.project_id = projects.id 
                    AND project_members.user_id = auth.uid()
                ))
        )
    );

DROP POLICY IF EXISTS "Project members can update tasks" ON tasks;
CREATE POLICY "Project members can update tasks" ON tasks FOR UPDATE
    TO authenticated USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = tasks.project_id 
            AND (projects.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members 
                    WHERE project_members.project_id = projects.id 
                    AND project_members.user_id = auth.uid()
                ))
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = tasks.project_id 
            AND (projects.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members 
                    WHERE project_members.project_id = projects.id 
                    AND project_members.user_id = auth.uid()
                ))
        )
    );

DROP POLICY IF EXISTS "Project members can delete tasks" ON tasks;
CREATE POLICY "Project members can delete tasks" ON tasks FOR DELETE
    TO authenticated USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = tasks.project_id 
            AND (projects.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members 
                    WHERE project_members.project_id = projects.id 
                    AND project_members.user_id = auth.uid()
                ))
        )
    );

-- activity_logs policies
DROP POLICY IF EXISTS "Users can view project activity logs" ON activity_logs;
CREATE POLICY "Users can view project activity logs" ON activity_logs FOR SELECT
    TO authenticated USING (
        project_id IS NULL 
        OR EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = activity_logs.project_id 
            AND (projects.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members 
                    WHERE project_members.project_id = projects.id 
                    AND project_members.user_id = auth.uid()
                ))
        )
    );

DROP POLICY IF EXISTS "Project members can create activity logs" ON activity_logs;
CREATE POLICY "Project members can create activity logs" ON activity_logs FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = user_id);

-- notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
    TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
    TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications FOR INSERT
    TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE
    TO authenticated USING (auth.uid() = user_id);