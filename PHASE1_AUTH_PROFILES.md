# PHASE1_AUTH_PROFILES

## 1. PHASE GOAL
This phase focuses on designing and implementing the authenticated user account experience immediately following a successful login. 
The core objective is to transition from a bare-bones logged-in state to a polished, UX-driven environment where users can manage their account details.

**User Flow After Login:**
1. User logs in successfully and is redirected to the `/` dashboard.
2. In the top-right corner of the application layout, a persistent Account/Avatar button replaces the static 'Log out' button.
3. Clicking this button reveals a clean, accessible dropdown menu displaying the user's information and quick actions (Profile, Log out).
4. Navigating to 'Profile' brings the user to a dedicated `/profile` route to manage their identity.

## 2. UX REQUIREMENTS
The implementation must adhere to the following user experience expectations:
- **Top-Right Account/Avatar Button**: A prominent but unobtrusive button in the global dashboard header.
- **Avatar Image Support**: Display the user's avatar image if one exists in their profile data.
- **Initials Fallback**: If no avatar image is available, conditionally render a styled circle with the user's initials (e.g., "JD" for John Doe). If names aren't set, fallback to the first letter of their email.
- **Dropdown Behavior**: The dropdown menu must open confidently on click (not hover) and close when clicking entirely outside of the menu or when selecting an item.
- **Dropdown Header**: The top of the dropdown menu must cleanly display the user's email and name (if available) to confirm identity.
- **Menu Options**: 
  - `Profile`: Navigates to `/profile`
  - `Log out`: Triggers the Supabase sign-out sequence.
- **Logout Validation**: If the user logs out from the menu, they must instantly be routed back to `/signup` or `/login`.
- **Route Protection Compliance**: Logged-out users must seamlessly be denied access to the `/profile` page and kicked out to the public routes. (Current `_app.js` should already handle this if `/profile` is absent from `PUBLIC_ROUTES`).

## 3. PROFILE PAGE REQUIREMENTS
A dedicated `/profile` route that acts as the user's control center. Needs to include:
- **Basic Account Details**: Clear title, simple description, and intuitive form layout.
- **Editable Name Fields**: Input field for Full Name (or split First/Last).
- **Email Display**: A read-only display of the user's auth email (to avoid complex email change flows for now).
- **Optional Avatar Management**: A visual placeholder or foundational hook for a future profile picture uploader.
- **Save/Update Flow**: A distinct "Save Changes" button that updates the user's metadata in Supabase (updating `user_metadata` via `supabase.auth.updateUser`).
- **Loading & State**: Proper loading spinners or indicator states during save.
- **Feedback States**: Success banners/toasts when the profile is updated, and clear error notices if the save operation fails.

## 4. NAVIGATION / LAYOUT IMPACT
- **Header Placement**: The account button will live in a shared navigation layout header rather than being hardcoded onto index pages. 
- **Layout Modifications**: Implement an overarching `DashboardLayout` component to ensure consistent navigation wrappers across `/` and `/profile`.
- **Responsive Behavior**: 
  - *Desktop*: Avatar button pinned to the top right of the application container.
  - *Mobile*: The avatar button remains in the top right, but the dropdown should be easily tappable and sized appropriately to not overflow the narrower viewport.

## 5. FILE-BY-FILE IMPLEMENTATION PLAN

### `components/layout/DashboardLayout.jsx` (NEW)
- **Purpose**: Creates a cohesive structural wrapper for authenticated pages.
- **Action**: Defines the `gray-950` backdrop. Contains a minimalist Header rendering the page title/breadcrumbs on the left, and the `ProfileDropdown` on the right. Wraps the main Next.js page components within its `children`.

### `components/auth/ProfileDropdown.jsx` (NEW)
- **Purpose**: Interactive avatar button combined with its popover action menu.
- **Action**: Calculates initials or image rendering using the `session.user` data passed down.
- **Action**: Employs simple React state or Headless UI to toggle the display array of the dropdown.
- **Action**: Moves the `handleLogout` function (`supabase.auth.signOut()`) out of `pages/index.jsx` and houses the logout action directly inside the dropdown.

### `pages/index.jsx` (UPDATE)
- **Purpose**: Clean up the main dashboard view.
- **Action**: Remove the hardcoded "Log out" button and raw header arrangements.
- **Action**: Wrap the existing task manager layout inside the newly created `<DashboardLayout>` (or rely on `_app.js` to automatically mount the layout).

### `pages/profile.jsx` (NEW)
- **Purpose**: The main profile and account settings page.
- **Action**: Renders securely inside `<DashboardLayout>`. Accesses the user `session` prop automatically delivered via `_app.js`.
- **Action**: Includes the `ProfileForm` for editing fields.

### `components/profile/ProfileForm.jsx` (NEW)
- **Purpose**: Manages local form state and remote database update execution.
- **Action**: Renders input fields for the user's name, a disabled text field displaying their email, and an "Update Profile" submit trigger.
- **Action**: Executes `supabase.auth.updateUser({ data: { full_name: ... } })` to submit data to Supabase local metadata payload. 
- **Action**: Supplies localized contextual flash notices for success and/or errors.
- **Action**: Designs a visual placeholder for the Avatar to prepare for the subsequent phase.

### `pages/_app.js` (EVALUATE/UPDATE)
- **Purpose**: Standardize layouts, ensure secure routing constraints securely accommodate `/profile`.
- **Action**: No heavy changes needed—simply verify that the `DashboardLayout` is smoothly injected. Also passively guarantees `/profile` remains heavily guarded since it deliberately lacks an entry within `PUBLIC_ROUTES`.

## 6. CHECKLIST
- [ ] Create `ProfileDropdown` component equipped with initials fallback.
- [ ] Relocate `handleLogout` flow from `index.jsx` and plant it directly into `ProfileDropdown`.
- [ ] Produce `DashboardLayout` mapping the header interface securely across internal dashboard applications.
- [ ] Refactor `pages/index.jsx` to inherit the `DashboardLayout` container UI.
- [ ] Build the newly protected route destination: `pages/profile.jsx`.
- [ ] Code the standard `ProfileForm` component containing inputs for metadata (`full_name`) and reading user email.
- [ ] Wire the Supabase `updateUser` method into the `ProfileForm` submit handler button.
- [ ] Ensure valid success/error state UI flows into `ProfileForm` after updates.
- [ ] Test overall routing validation (i.e. force a URL type-in to `/profile` without active credentials).

## 7. VERIFICATION / TESTING
A concrete manual testing plan to certify that we've satisfied all UX requisites.
- **Login Verification**: Navigation to `/login` with credentials automatically pushes to `/`.
- **Review Dropdown**: Upon reaching `/`, the top right is decorated with an Avatar circle successfully denoting fallback initializations representing the active user. When clicked, an elegant dropdown menu seamlessly appears.
- **Profile Entry**: Clicking "Profile" in the dropdown reliably brings the system to `/profile`. Wait for the UI layout consistency to remain stable across both routes.
- **Profile Edit Validation**: Type a new name in the provided inputs and hit 'Save'. Ensure loading behavior triggers effectively, along with an eventual definitive success prompt. Reload the window—the new name must persist correctly.
- **Logout Testing**: Pop open the dropdown and hit "Log out". Ascertain that the UI rapidly purges the session and relocates you correctly to `/signup`.
- **Blacklist Authentication check**: Emulate an illicit route connection; while actively logged out, manually force the browser URL to `/profile`. Notice you are actively blocked out and instantaneously redirected to public scopes via the `_app.js` route barricade.

## 8. FUTURE IMPROVEMENTS (NEXT PHASE)
- **Avatar Interactivity Uploading**: Install `@supabase/storage-js` logic allowing profile picture uploads mapped straight back to active bucket configurations securely.
- **Roles and Preferences Control**: Adapt dynamic capabilities for internal settings pages extending deeper into notification flags, interface theming preferences, and internal authorization scopes.
- **Deep Authentication Overhauls**: Password resets, complex email updating loops, and robust multi-device active session visualization tools.
