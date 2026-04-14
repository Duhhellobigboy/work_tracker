# Implementation Plan: Auth Login Roles

## 1. Objective
The goal is to implement a robust Role-Based Access Control (RBAC) system for the existing task manager application. This will extend the current Supabase authentication setup by assigning specific roles (Admin, Manager, User) to users, ensuring that individuals can only access pages, execute actions, and view data appropriate for their assigned permissions.

## 2. Acceptance Criteria
- **Authentication**: Users can sign up and log in securely.
- **Role Assignment**: Every authenticated user is assigned a specific role (defaulting to `user` upon signup).
- **Admin Capabilities**: An Admin can view, edit, and manage all tasks across the system, regardless of the task owner.
- **Manager Capabilities**: A Manager can view and manage tasks for their team or those explicitly assigned/visible to them.
- **User Capabilities**: A regular User can only view, create, edit, and delete their own tasks.
- **Access Control**: Unauthorized or unauthenticated users cannot access restricted pages or perform restricted API/database actions.

## 3. Database Changes
To maintain clean separation between Supabase's internal auth system and our app's public user data, we will introduce a `profiles` table linked to `auth.users` via a trigger.

### Recommended Schema Update:
```sql
-- Create a custom type for roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');

-- Create the profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 4. RLS / Security Plan
Row Level Security (RLS) on the `tasks` and `profiles` tables will be the primary enforcement mechanism for these roles. To do this securely, we'll use a `security definer` function to check the current user's role without causing infinite recursion in RLS.

**`profiles` Table Policies:**
- **Select**: Users can read their own profile. Admins and Managers can read all profiles.
- **Update**: Users can update non-role fields (like name/avatar) on their own profile. Only Admins can update the `role` field.

**`tasks` Table Policies:**
- **Select**:
  - `user`: `auth.uid() = user_id`
  - `manager`: `auth.uid() = user_id` OR task is assigned to a managed team member
  - `admin`: `true` (Can see all)
- **Insert**: Users can only insert tasks where `user_id = auth.uid()`. Admins have unrestricted insert.
- **Update/Delete**: Same conditions as Select.

Example Task Select Policy:
```sql
CREATE POLICY "Role-based task visibility"
  ON tasks FOR SELECT
  USING (
    user_id = auth.uid() OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );
```

## 5. Frontend Changes
- **Login/Signup Flow**: Keep existing UI, but update routing to fetch the user's role immediately after authentication to cache it in frontend state (React Context or Zustand).
- **Route Protection**: Ensure `pages/index.jsx` (Dashboard) redirects to login if unauthenticated.
- **Redirect Behavior**: After login, push users to `/`. If a user lands on a forbidden route, show a 403 or redirect them.
- **Role-based UI Visibility**:
  - Implement a `useRole` hook or AuthContext standard.
  - Hide the "All Tasks" view or "Manage Users" button from standard users.
  - Only Admins/Managers should see organizational filtering options in the UI.

## 6. API / Query Changes
- Use the Supabase JavaScript client normally. Thanks to RLS, `supabase.from('tasks').select('*')` will automatically filter out rows the user shouldn't see.
- The UI logic should still request appropriate filters (e.g., pulling a specific user's tasks) depending on the active view.
- For updating roles, create an Admin-only Edge Function or Admin-only API route if bypassing RLS is necessary (e.g., using service role key), or strictly rely on RLS policies that only allow Admins to update `profiles.role`.

## 7. Pages / Components to Update
- `pages/_app.js`: Wrap the application in an `<AuthProvider>` to provide `session` and `role` globally.
- `pages/login.jsx`: redirect to dashboard on success.
- `pages/signup.jsx`: Ensure user receives confirmation that their account was created.
- `pages/index.jsx` (Dashboard): 
  - Add conditional rendering to show different task views based on role.
  - E.g., `if (role === 'admin') <AdminDashboard /> else if (role === 'manager') <ManagerDashboard />` or keep one layout with toggles.
- `lib/api-auth.js` / `lib/supabase-browser.js`: Update utilities to expose role fetching methods (e.g., `getUserRole()`).
- [NEW] `components/ProtectedRoute.jsx`: An HOC or wrapper to encapsulate role-checking logic.

## 8. Implementation Order
1. **Database Schema**: Execute SQL to create `user_role` enum, `profiles` table, and the auth trigger.
2. **Backfill Existing Users**: Write a short SQL script to insert rows into `profiles` for any existing users in `auth.users`.
3. **Apply RLS Policies**: Drop the current "Allow all for now" policies on `tasks`. Implement the new role-based policies on both `tasks` and `profiles`.
4. **Auth Context & Utilities**: Build the frontend hooks/providers in React to fetch and distribute the authenticated user's profile info.
5. **Route Protection**: Wrap the main pages so unauthenticated traffic is punted to `/login`.
6. **UI Adjustments**: Update `pages/index.jsx` to dynamically render admin vs user views based on the session role.
7. **Testing & QA**: Verify that Admin, Manager, and User accounts function as intended.

## 9. Testing Checklist
- [ ] **Signup**: Creating a new account automatically generates a `profiles` row with role `user`.
- [ ] **Standard User**: Can log in, see only their own tasks, create tasks, edit their tasks, and cannot fetch any other user's tasks (Network tab validation).
- [ ] **Manager Role**: Can view all tasks for assigned/managed contexts. Cannot update another manager's tasks.
- [ ] **Admin Role**: Automatically sees all tasks in the system.
- [ ] **Unauthorized**: Attempting to query `supabase.from('profiles').update({ role: 'admin' })` as a regular user fails with RLS violation.
- [ ] **Routing**: Unathenticated navigation to `/` redirects back to `/login`.

## 10. Future Improvements
- **Invite-only Accounts**: Allow admins to send out email invitations mapping directly to proper roles pre-signup.
- **Admin User Management Page**: A dedicated `/admin/users` UI to list users, change roles, and suspend accounts.
- **Team Assignment**: Introduce a `teams` and `team_members` relationship so 'manager' roles only see tasks belonging to their specific teams, rather than just using a generic manager policy.
- **Audit Logs**: Track whom changed a user's role or deleted overarching tasks.
