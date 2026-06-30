/*
# Create profiles, courses, posts, and lecturer_messages tables

1. New Tables
- `profiles`: extends auth.users with role and full_name
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `full_name` (text, not null)
  - `role` (text, not null, check: 'student', 'lecturer', 'admin')
  - `created_at` (timestamptz, default now())
- `courses`: admin-managed courses
  - `id` (uuid, primary key)
  - `code` (text, unique, not null)
  - `title` (text, not null)
  - `department` (text)
  - `credits` (int, default 3)
  - `created_at` (timestamptz, default now())
- `posts`: announcements visible to all users
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `content` (text, not null)
  - `author_id` (uuid, references profiles)
  - `target_role` (text, default 'all') -- 'all', 'student', 'lecturer'
  - `created_at` (timestamptz, default now())
- `lecturer_messages`: messages from lecturers to specific courses
  - `id` (uuid, primary key)
  - `course_id` (uuid, references courses)
  - `lecturer_id` (uuid, references profiles)
  - `title` (text, not null)
  - `content` (text, not null)
  - `created_at` (timestamptz, default now())
- `student_courses`: tracks which students are in which courses
  - `id` (uuid, primary key)
  - `student_id` (uuid, references profiles)
  - `course_id` (uuid, references courses)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on all tables.
- Profiles: authenticated users can read all profiles, insert/update their own.
- Courses: all authenticated users can read; only admins can write.
- Posts: all authenticated users can read; authors can write.
- Lecturer_messages: all authenticated users can read; lecturers can write.
- Student_courses: students can manage their own enrollments.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  department text,
  credits int NOT NULL DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_role text NOT NULL DEFAULT 'all' CHECK (target_role IN ('all', 'student', 'lecturer')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lecturer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lecturer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Courses policies
DROP POLICY IF EXISTS "select_courses" ON courses;
CREATE POLICY "select_courses" ON courses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_courses" ON courses;
CREATE POLICY "admin_insert_courses" ON courses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_courses" ON courses;
CREATE POLICY "admin_update_courses" ON courses FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_courses" ON courses;
CREATE POLICY "admin_delete_courses" ON courses FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Posts policies
DROP POLICY IF EXISTS "select_posts" ON posts;
CREATE POLICY "select_posts" ON posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_posts" ON posts;
CREATE POLICY "insert_posts" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "update_own_posts" ON posts;
CREATE POLICY "update_own_posts" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "delete_own_posts" ON posts;
CREATE POLICY "delete_own_posts" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- Lecturer messages policies
DROP POLICY IF EXISTS "select_lecturer_messages" ON lecturer_messages;
CREATE POLICY "select_lecturer_messages" ON lecturer_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_lecturer_messages" ON lecturer_messages;
CREATE POLICY "insert_lecturer_messages" ON lecturer_messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = lecturer_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'lecturer')
  );

DROP POLICY IF EXISTS "update_own_lecturer_messages" ON lecturer_messages;
CREATE POLICY "update_own_lecturer_messages" ON lecturer_messages FOR UPDATE
  TO authenticated USING (auth.uid() = lecturer_id) WITH CHECK (auth.uid() = lecturer_id);

DROP POLICY IF EXISTS "delete_own_lecturer_messages" ON lecturer_messages;
CREATE POLICY "delete_own_lecturer_messages" ON lecturer_messages FOR DELETE
  TO authenticated USING (auth.uid() = lecturer_id);

-- Student courses policies
DROP POLICY IF EXISTS "select_student_courses" ON student_courses;
CREATE POLICY "select_student_courses" ON student_courses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_student_courses" ON student_courses;
CREATE POLICY "insert_own_student_courses" ON student_courses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "delete_own_student_courses" ON student_courses;
CREATE POLICY "delete_own_student_courses" ON student_courses FOR DELETE
  TO authenticated USING (auth.uid() = student_id);
