# Login System Implementation Plan

## Goal
Implement Supabase Auth so users can sign up, sign in, and only access their own tasks.

---

## 1) Auth Foundation
- Use Supabase built-in users in `auth.users` (no manual user rows in `tasks`).
- Add a browser-safe Supabase client using:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Keep service-role Supabase client server-only for trusted backend operations.

---

## 2) Auth Pages and UX
- Build `/login` page with:
  - Email + password inputs
  - Loading button state
  - Inline error messaging
  - Redirect to `/` on success
- Build `/signup` page with:
  - Email + password inputs
  - Sign-up success messaging
  - Email verification handling note (if enabled in Supabase settings)
- Add links between `/login` and `/signup`.

---

## 3) Core Auth Calls

### Login
```js
await supabase.auth.signInWithPassword({
  email,
  password
});
```

### Sign Up
```js
await supabase.auth.signUp({
  email,
  password
});
```

### Sign Out
```js
await supabase.auth.signOut();
```

---

## 4) Session + Route Guarding
- On app load, check current session (`supabase.auth.getSession()`).
- If unauthenticated, redirect protected pages to `/login`.
- If authenticated, prevent revisiting `/login` and `/signup` by redirecting to `/`.
- Keep guard logic in one place where possible (shared hook or page-level check).

---

## 5) Task Ownership and Data Security (Required)
To enforce "users only see their own tasks":

1. Add `user_id uuid not null` to `tasks`.
2. Backfill existing rows if needed (or remove old test rows).
3. Enable Row Level Security on `tasks`.
4. Add policies:
   - `select`: allow when `user_id = auth.uid()`
   - `insert`: allow when `user_id = auth.uid()`
   - `update`: allow when `user_id = auth.uid()`
   - `delete`: allow when `user_id = auth.uid()`
5. Ensure every new task insert includes current `user_id`.

---

## 6) API Layer Alignment
- Update task API routes to identify user from auth context/JWT when needed.
- Remove global cross-user fetch behavior.
- Return only user-scoped task rows.

---

## 7) Validation and Manual Test Plan
- Login with valid credentials -> redirect to `/`.
- Login with invalid credentials -> clear inline error.
- Signup with new email -> account created (and verify email flow if enabled).
- Refresh browser -> session stays active.
- Logout -> redirected to `/login`.
- Confirm User A cannot see/update User B tasks.

---

## Current Status
- Implemented: polished `/login` page UI and `signInWithPassword` flow.
- Next: `/signup`, session guards, and full RLS/data-ownership enforcement.