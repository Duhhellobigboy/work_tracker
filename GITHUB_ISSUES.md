# GITHUB_ISSUES_GUIDE.md

We will build the system in phases.

Do NOT paste full files into chat.
Instead, use this file to guide issue creation.

---

## Phase 1: Authentication & Profiles ✅

- Connect Supabase client
- Auth flow (Sign up, Sign in, Sign out)
- Create `profiles` table
- Sync user → profile
- Avatar handling (Supabase storage)
- Protected routes
- Role-based redirect logic

---

## Phase 2: Session & Category Management

- CRUD for `categories`
- CRUD for `session_types`
- CRUD for `sessions`
- Availability rules (JSONB recurrence)
- Admin UI for sessions (list, create, edit)
  - Add a collapsible sidebar
  - Include breadcrumb navigation with small text
  - Add a real-time notification center
  - Add trend indicators on cards
  - Add a date-range filter for dashboard cards
  - Add contextual quick actions
  - *Note: Skip quick search and skeleton loading states for now*

---

## Phase 3: Booking Logic & Evolution

- Booking flow (user → client)
- Enforce booking limits (`max_booking_days_advance`)
- Admin dashboard widgets
  - total bookings
  - active users

---

## Phase 4: History & Logging

- Store login history
- Store session history
- Admin booking history view

---

## Phase 5: Admin Controls & Reporting

- User management (roles, delete users)
- Analytics (charts, usage stats)
- App settings (booking limits, configs)

---

## How to Work (IMPORTANT)

For EVERY task:

1. Ask AI to:
   - check MCP connections (GitHub + Supabase)

2. Then:
   - create a GitHub issue

3. Do NOT code yet

---

## Prompt Template (copy this into Antigravity)

hey dev, create a new issue.

we are working on: [INSERT PHASE + TASK]

do not code yet.

first:
- verify MCP connections (github + supabase)

then:
- create a github issue

include:
- title
- objective
- database context
- required tables/fields
- relationships
- RLS policies
- acceptance criteria

do not implement yet.