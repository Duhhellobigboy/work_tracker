# fix-supabase-auth-race.md
## Practical Repair Plan — Supabase Auth Race Condition

---

## 1. Project Audit Summary

### What This Project Is
- **Router**: Pages Router (`pages/`)
- **Auth library**: `@supabase/supabase-js` v2.103.0 (no `@supabase/ssr`)
- **Supabase pattern**: two clients — singleton browser client (`lib/supabase-browser.js`) + service-role server client (`lib/supabase.js`)
- **Env vars**: all present in `.env.local` ✓
- **Build**: `next build` passes — no compilation or type errors ✓
- **Dev server**: `next dev` starts — no startup crash ✓

The app **compiles and starts**, but has **runtime bugs** introduced by the previous partial fix.

---

## 2. What the Previous Fix Got Right

The diff shows these correct changes:
- Moved `supabase` singleton to module-level in `_app.js` (correct — prevents multiple browser clients)
- Removed per-request `supabase.auth.getSession()` from `index.jsx:apiFetchWithAuth` (correct — this was the direct cause of the lock error)
- Separated session state from route guard (correct architecture)
- Passed `session` prop from `_app.js` down to pages (correct)

**The previous fix is directionally correct. The lock error from concurrent `getSession()` calls has been eliminated for single-tab use.**

---

## 3. Real Blockers — Categorized

### 3a. CRITICAL — App Can Hang Forever

**Bug: No error handling on `getSession()` in `_app.js`**

File: `pages/_app.js:21`

```js
// CURRENT (broken under network errors)
supabase.auth.getSession().then(({ data }) => {
  if (mounted) {
    setSession(data.session)
    setAuthReady(true)
  }
})
// If getSession() throws or rejects, authReady is NEVER set to true.
// User sees "Loading..." indefinitely.
```

If the Supabase project is paused, the network is down, or any error occurs, `authReady` is never set to `true`. The app shows "Loading..." forever with no way for the user to recover.

**Impact**: App appears broken/unresponsive in any degraded-network scenario.

---

### 3b. HIGH — Tasks Will Not Load After Token Refresh (~1 hour mark)

**Bug: Stale closure in `fetchTasks` via `useCallback([])`**

File: `pages/index.jsx:91–107`

```js
// CURRENT (broken after token refresh)
async function apiFetchWithAuth(path, options = {}) {
  const token = session?.access_token  // closes over first-render session
  return apiFetch(path, options, token)
}

const fetchTasks = useCallback(async () => {
  ...
  const { tasks } = await apiFetchWithAuth('/api/tasks')  // captures first-render apiFetchWithAuth
  ...
}, [])  // ← empty deps = stale closure
```

`useCallback([])` freezes `fetchTasks` with the `apiFetchWithAuth` function from render #1. When Supabase refreshes the token (every ~1 hour), `_app.js` updates `session` via `onAuthStateChange`, `Home` re-renders with a new `session` prop — but `fetchTasks` still calls the render-#1 version with the old token.

After token refresh:
- `handleAdd`, `handleDone`, `handleSnooze` work correctly (plain functions, not memoized)
- `fetchTasks` sends an expired token → API returns 401 → task list goes blank

**Impact**: Silent API failure. After ~1 hour, the task list stops updating.

---

### 3c. MEDIUM — Double Redirect Race on Login

**Bug: `login.jsx` and the route guard both navigate to `/` simultaneously**

Files: `pages/login.jsx:31`, `pages/_app.js:48–50`

```js
// login.jsx (after successful signInWithPassword)
await router.push('/')   // ← explicit navigation

// _app.js route guard (triggered by onAuthStateChange → session update)
} else if (session && isPublicRoute) {
  router.replace('/')    // ← second navigation fires at the same time
}
```

After `signInWithPassword` returns:
1. `onAuthStateChange` fires → `setSession(newSession)` → route guard fires → `router.replace('/')`
2. `router.push('/')` in `login.jsx` fires immediately after

Two concurrent navigation calls to `/`. In practice this causes a visible flash or occasionally a stalled navigation where the user stays on `/login` until the next render cycle.

**Same problem applies to `signup.jsx:36`.**

**Impact**: Visible flicker on login, possible navigation stall on slower machines.

---

### 3d. MEDIUM — Double Redirect Race on Logout

**Bug: `handleLogout` and the route guard both navigate to `/signup`**

File: `pages/index.jsx:167–170`

```js
// index.jsx handleLogout
async function handleLogout() {
  await supabase.auth.signOut()
  await router.replace('/signup')   // ← explicit redirect
}

// _app.js route guard (triggered by signOut → onAuthStateChange → session=null)
if (!session && !isPublicRoute) {
  router.replace('/signup')    // ← also fires
}
```

After `signOut()`, two `router.replace('/signup')` calls happen. Usually harmless but can cause a brief flash or React state update after unmount.

**Impact**: Minor flicker, possible "Can't perform a React state update on an unmounted component" warning.

---

### 3e. LOW — Code Quality Issues (Non-Breaking)

These do not break the app but should be cleaned up:

| # | File | Line | Issue |
|---|------|------|-------|
| 1 | `pages/_app.js` | 14 | `publicRoutes` array defined inside component — recreated on every render |
| 2 | `pages/index.jsx` | 78 | `getBrowserSupabase()` called inside component body on every render |
| 3 | `pages/index.jsx` | 107 | `fetchTasks` missing `session` in `useCallback` deps |

---

### 3f. ARCHITECTURE — Lock Error With Multiple Tabs (Root Cause Not Fully Fixed)

The singleton pattern fixes the lock error for **single-tab use**. But if the user opens the app in two tabs simultaneously, each tab has its own JavaScript singleton. Both tabs access the same `localStorage` auth key. Under concurrent token refresh in two tabs, the original lock error can still occur.

**The full fix requires `@supabase/ssr`** — replacing localStorage-based session storage with cookie-based session management. This is a larger refactor and is listed here as an architectural debt item, not in the step-by-step repair below.

---

## 4. Repair Plan — Execution Order

Execute in order. Each step unblocks the next.

---

### Step 1 — Fix `getSession()` Error Handling to Unblock the App

**File**: `pages/_app.js`
**Lines**: 21–26
**Problem solved**: App hangs at "Loading..." if Supabase is unavailable or returns an error

```js
// REPLACE:
supabase.auth.getSession().then(({ data }) => {
  if (mounted) {
    setSession(data.session)
    setAuthReady(true)
  }
})

// WITH:
supabase.auth.getSession()
  .then(({ data }) => {
    if (mounted) {
      setSession(data.session ?? null)
      setAuthReady(true)
    }
  })
  .catch(() => {
    if (mounted) {
      setAuthReady(true)  // treat as unauthenticated, let route guard redirect
    }
  })
```

---

### Step 2 — Fix `fetchTasks` Stale Closure

**File**: `pages/index.jsx`
**Lines**: 91–107
**Problem solved**: Tasks fail to load silently after Supabase token refresh

**Option A — Move token read inside `fetchTasks` (simplest fix):**

```js
// Remove apiFetchWithAuth entirely from the useCallback scope.
// Read session directly inside the callback using the prop.
const fetchTasks = useCallback(async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/tasks', {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Request failed')
    setTasks(json.tasks)
  } catch (e) {
    flash(e.message, 'error')
  } finally {
    setLoading(false)
  }
}, [session])  // ← session IS the dependency
```

**Option B — Keep `apiFetchWithAuth` but add `session` to deps:**

```js
const fetchTasks = useCallback(async () => {
  setLoading(true)
  try {
    const { tasks } = await apiFetchWithAuth('/api/tasks')
    setTasks(tasks)
  } catch (e) {
    flash(e.message, 'error')
  } finally {
    setLoading(false)
  }
}, [session])  // ← add session here
```

Note: If `session` is in deps, `fetchTasks` changes when session changes, which triggers the `useEffect(() => { fetchTasks() }, [fetchTasks])`. This means tasks are re-fetched automatically on token refresh — which is the CORRECT behavior.

---

### Step 3 — Fix Double Redirect After Login

**File**: `pages/login.jsx`
**Line**: 31
**Problem solved**: Navigation race between `login.jsx` and route guard

```js
// REMOVE this line from handleLogin:
await router.push('/')

// The route guard in _app.js already handles the redirect when
// onAuthStateChange fires with the new session.
// No explicit navigation needed here.
```

**File**: `pages/signup.jsx`
**Line**: 36–37
**Same fix — remove the manual router push:**

```js
// REMOVE:
if (hasSession) {
  await router.push('/')
  return
}
// Route guard handles the redirect.
```

---

### Step 4 — Fix Double Redirect After Logout

**File**: `pages/index.jsx`
**Lines**: 167–172
**Problem solved**: Race between explicit logout redirect and route guard redirect

```js
// REPLACE:
async function handleLogout() {
  try {
    await supabase.auth.signOut()
    await router.replace('/signup')
  } catch (e) {
    flash(e.message, 'error')
  }
}

// WITH:
async function handleLogout() {
  try {
    await supabase.auth.signOut()
    // onAuthStateChange fires → session = null → route guard redirects to /signup
    // No explicit redirect needed.
  } catch (e) {
    flash(e.message, 'error')
  }
}
```

---

### Step 5 — Move `publicRoutes` Outside Component

**File**: `pages/_app.js`
**Line**: 14
**Problem solved**: Unnecessary array allocation on every render

```js
// MOVE outside the App component, above the export default:
const PUBLIC_ROUTES = ['/login', '/signup']

export default function App({ Component, pageProps }) {
  ...
  // Replace all publicRoutes references with PUBLIC_ROUTES
```

---

### Step 6 — Move `getBrowserSupabase()` Out of Component Body in `index.jsx`

**File**: `pages/index.jsx`
**Line**: 78
**Problem solved**: Redundant call on every render (singleton returns same object, but call overhead is unnecessary)

```js
// AT MODULE LEVEL (after imports, before component):
const supabase = getBrowserSupabase()

// REMOVE from inside the Home component body:
// const supabase = getBrowserSupabase()  ← delete this line
```

---

### Step 7 — Verify API Route Auth Flow End-to-End

**Files to check**: `lib/api-auth.js`, `lib/supabase.js`

These files are currently correct but verify:

1. `lib/supabase.js` — service-role client is server-only. Confirm it is never imported in any `pages/` component (only in `pages/api/`). ✓

2. `lib/api-auth.js` — creates a new anon client per request for JWT verification. This is correct for server-side use (no localStorage lock). The `getUser(accessToken)` call validates the JWT against Supabase. ✓

3. **Potential brittle point**: `lib/supabase.js` throws at module level if env vars are missing. This will crash all API routes if `SUPABASE_SERVICE_ROLE_KEY` is absent. No code change needed (key is present in `.env.local`), but document this.

---

### Step 8 — Verify Auth Flow Manually

After applying all fixes, test this sequence:

1. Open app at `http://localhost:3000` (not logged in)
   - Expected: Redirect to `/signup`

2. Sign up with email/password
   - If email confirmation OFF: session created immediately → route guard redirects to `/`
   - If email confirmation ON: "Check your email" message shown, stay on `/signup`

3. Log in at `/login`
   - Expected: Single redirect to `/` (not double-flash)
   - Expected: Tasks load (empty list if no tasks yet)

4. Add a task via the input
   - Expected: AI parses → task appears in list

5. Mark task Done / Snooze
   - Expected: Task updates immediately

6. Log out via "Log out" button
   - Expected: Single redirect to `/signup`
   - Expected: No "state update after unmount" warnings in console

---

## 5. Summary — What the Previous Fix Got Wrong or Missed

| Issue | Previous Fix | Verdict |
|-------|-------------|---------|
| Multiple `getSession()` calls causing lock | Removed from `apiFetchWithAuth` | ✓ Correct fix |
| Session passed as prop to pages | Added `session` to `<Component>` | ✓ Correct |
| Singleton client | Module-level `getBrowserSupabase()` | ✓ Correct |
| `getSession()` error handling | Not added | ✗ **Missing** — app hangs on error |
| `fetchTasks` stale closure | Not addressed | ✗ **Missing** — breaks after token refresh |
| Double navigation on login/logout | Not addressed | ✗ **Missing** — causes race flicker |
| Multiple-tab lock error | Not fixed (requires `@supabase/ssr`) | ⚠ Partial — single-tab is OK |

---

## 6. Cursor-Ready Execution Prompt

Paste this into Cursor:

---

```
You are fixing a broken Next.js 14 Pages Router app that uses @supabase/supabase-js v2.
The app had a lock race condition that was partially fixed. It still has runtime bugs.
Do NOT rewrite the app. Fix only the issues listed below, exactly as described.

FILES TO EDIT:

━━━ pages/_app.js ━━━

1. Move `const PUBLIC_ROUTES = ['/login', '/signup']` to module scope (above the App component).
   Remove `const publicRoutes = ['/login', '/signup']` from inside the component.
   Replace all uses of `publicRoutes` with `PUBLIC_ROUTES`.

2. In the useEffect that calls `supabase.auth.getSession()`, add a `.catch()` handler:
   
   supabase.auth.getSession()
     .then(({ data }) => {
       if (mounted) {
         setSession(data.session ?? null)
         setAuthReady(true)
       }
     })
     .catch(() => {
       if (mounted) setAuthReady(true)
     })

━━━ pages/index.jsx ━━━

3. Move `const supabase = getBrowserSupabase()` to module scope (above the Home component, after imports).
   Remove the same line from inside the Home component body.

4. In `fetchTasks`, add `session` to the useCallback dependency array:
   Change `}, [])` at the end of `fetchTasks` to `}, [session])`.

5. In `handleLogout`, remove the `await router.replace('/signup')` line.
   The route guard in _app.js handles that redirect automatically via onAuthStateChange.
   Keep the `supabase.auth.signOut()` call. Keep the catch block.

━━━ pages/login.jsx ━━━

6. In `handleLogin`, remove the line `await router.push('/')`.
   The _app.js route guard already redirects to / when onAuthStateChange fires with the new session.
   The signInWithPassword call and error handling should remain exactly as-is.

━━━ pages/signup.jsx ━━━

7. In `handleSignup`, remove the block:
     if (hasSession) {
       await router.push('/')
       return
     }
   The _app.js route guard handles the redirect. The success message logic below it stays.

━━━ VERIFICATION ━━━

After editing, confirm:
- `npm run dev` starts without errors
- Navigating to / while logged out → redirects to /signup (single redirect, no loop)
- Logging in at /login → single redirect to /, tasks load
- Logging out → single redirect to /signup
- No console errors about "state update on unmounted component"

Do NOT change:
- lib/supabase-browser.js (singleton is correct)
- lib/supabase.js (service-role client is correct)
- lib/api-auth.js (per-request JWT verification is correct)
- pages/api/ routes (these work correctly)
- styles/ or tailwind config
- Any env variables

Root causes for each change:
- getSession .catch: without it, any Supabase error hangs the app at "Loading..." forever
- fetchTasks [session] dep: useCallback([]) creates a stale closure; after token refresh the old access_token is used and API calls return 401
- Remove router.push from login/signup: the route guard fires via onAuthStateChange at the same time, causing two concurrent navigations
- Remove router.replace from handleLogout: same double-navigation problem on sign out
```

---

*Generated: 2026-04-22 — based on direct inspection of current project state*
