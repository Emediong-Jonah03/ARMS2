# ARMS - Academic Resource Management System

A responsive Next.js dashboard for academic institutions to monitor student engagement, department activities, upcoming events, and system alerts.

---

## Project Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge |
| Backend (planned) | Supabase (Postgres + Auth + Edge Functions) |

### Directory Structure

```
src/
├── app/
│   ├── sections/          # Page section components
│   │   ├── Header.tsx          # Top navigation bar
│   │   ├── DashboardHeader.tsx # Page title area
│   │   ├── StatsCards.tsx      # Summary statistics grid
│   │   ├── EngagementChart.tsx # Weekly engagement bar chart
│   │   ├── DepartmentActivity.tsx # Department feed cards
│   │   ├── UpcomingEvents.tsx  # Event list cards
│   │   ├── SystemAlert.tsx     # Maintenance notice banner
│   │   └── BottomNav.tsx       # Mobile tab bar
│   ├── globals.css        # Global styles + custom animations
│   ├── layout.tsx         # Root layout with font loading
│   └── page.tsx           # Main dashboard page
├── lib/
│   └── utils.ts           # cn() helper for Tailwind class merging
public/                    # Static assets
next.config.ts             # Static export config
```

### Component Architecture

- **Page-centric**: Each section is a self-contained component under `app/sections/`
- **Animation-first**: All sections use Framer Motion for entrance, hover, and interaction animations
- **Responsive**: Mobile-first with bottom navigation on small screens, horizontal nav on desktop
- **Static export**: Configured for `output: 'export'` for deployment to any static host

### Animation Patterns

| Pattern | Usage |
|---------|-------|
| `initial` / `animate` | Staggered entrance on page load |
| `whileHover` | Card lift, button scale, link slide |
| `whileTap` | Button press feedback |
| `AnimatePresence` | Mobile menu expand/collapse |
| `layoutId` | Bottom nav active tab indicator |
| `spring` transitions | Notification badge pop, tab switch |

---

## Backend API Specification

The frontend currently renders static data. The following Supabase-backed API endpoints are needed to make the dashboard fully dynamic.

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/v1/signup` | POST | Email/password registration |
| `/auth/v1/token?grant_type=password` | POST | Email/password login |
| `/auth/v1/user` | GET | Current user profile |
| `/auth/v1/logout` | POST | Sign out |

### Database Tables & Endpoints

#### 1. `students`

```sql
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  student_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  department_id uuid REFERENCES departments(id),
  enrollment_date date NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/students` | GET | List all students (with filters) |
| `/rest/v1/students?select=count` | GET | Total student count |
| `/rest/v1/students` | POST | Enroll new student |
| `/rest/v1/students?id=eq.{id}` | PATCH | Update student |

#### 2. `lecturers`

```sql
CREATE TABLE lecturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  department_id uuid REFERENCES departments(id),
  title text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/lecturers` | GET | List lecturers |
| `/rest/v1/lecturers?select=count` | GET | Total lecturer count |
| `/rest/v1/lecturers` | POST | Add lecturer |

#### 3. `courses`

```sql
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  department_id uuid REFERENCES departments(id),
  credits int NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/courses` | GET | List courses |
| `/rest/v1/courses?select=count` | GET | Total active course count |
| `/rest/v1/courses` | POST | Create course |

#### 4. `departments`

```sql
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  icon text, -- lucide icon name
  color text, -- tailwind color class prefix
  created_at timestamptz DEFAULT now()
);
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/departments` | GET | List departments |
| `/rest/v1/departments` | POST | Create department |

#### 5. `department_activities`

```sql
CREATE TABLE department_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) NOT NULL,
  title text NOT NULL,
  description text,
  activity_type text NOT NULL, -- 'schedule_update', 'meeting', 'maintenance', etc.
  created_at timestamptz DEFAULT now()
);
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/department_activities?order=created_at.desc&limit=10` | GET | Recent department activities |
| `/rest/v1/department_activities` | POST | Log new activity |

#### 6. `engagement_metrics`

```sql
CREATE TABLE engagement_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week text NOT NULL, -- 'Mon', 'Tue', etc.
  active_students int NOT NULL,
  total_interactions int NOT NULL,
  week_start date NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/engagement_metrics?week_start=eq.{date}&order=day_of_week.asc` | GET | Weekly engagement data for chart |
| `/rest/v1/engagement_metrics` | POST | Record daily metric |

#### 7. `events`

```sql
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  event_type text DEFAULT 'general',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/events?order=start_time.asc&limit=10` | GET | Upcoming events |
| `/rest/v1/events` | POST | Create event |
| `/rest/v1/events?id=eq.{id}` | DELETE | Cancel event |

#### 8. `system_alerts`

```sql
CREATE TABLE system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  alert_type text DEFAULT 'maintenance', -- 'maintenance', 'urgent', 'info'
  start_time timestamptz,
  end_time timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/system_alerts?is_active=eq.true&limit=1` | GET | Current active alert |
| `/rest/v1/system_alerts` | POST | Publish new alert |
| `/rest/v1/system_alerts?id=eq.{id}` | PATCH | Update/resolve alert |

#### 9. `notifications`

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/v1/notifications?user_id=eq.{uid}&is_read=eq.false` | GET | Unread notifications |
| `/rest/v1/notifications?id=eq.{id}` | PATCH | Mark as read |

---

## Supabase Integration Notes

### Client Setup

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Row Level Security (RLS)

All tables must have RLS enabled. Example policy for `students`:

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_students" ON students FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_students" ON students FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_students" ON students FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_students" ON students FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
```

### Edge Functions (optional)

For complex aggregations (e.g., engagement percentage), deploy a Deno Edge Function:

```ts
// supabase/functions/engagement-summary/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // CORS headers required
  // Query engagement_metrics, compute percentages
  // Return JSON
})
```

Deploy with: `supabase functions deploy engagement-summary`

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Serve static build
npx serve out
```

---

## Deployment

The project is configured for static export (`output: 'export'`). Build output goes to the `out/` directory and can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- Any static file host
# ARMS2
