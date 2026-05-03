## ADDED Requirements

### Requirement: Settings has a tabbed left-sidebar shell

The system SHALL render a tabbed shell for the `/settings` area. The shell MUST include a vertical left-side sidebar at viewport widths ≥768px (Tailwind `md` breakpoint), stacking above the page content at narrower widths. The sidebar MUST contain two tab links labeled `Profile` (linking to `/settings/profile`) and `Account` (linking to `/settings/account`). The link whose `href` matches the current pathname MUST be visually marked as active.

#### Scenario: Sidebar renders both tabs on the Profile route

- **WHEN** a signed-in user views `/settings/profile`
- **THEN** the sidebar shows links labeled `Profile` and `Account`, and the `Profile` link is marked as active

#### Scenario: Sidebar renders both tabs on the Account route

- **WHEN** a signed-in user views `/settings/account`
- **THEN** the sidebar shows links labeled `Profile` and `Account`, and the `Account` link is marked as active

### Requirement: Bare /settings redirects to /settings/profile

The system SHALL redirect requests to `/settings` to `/settings/profile` via a server-side redirect, so the existing global-header `Settings` link and any historical bookmarks continue to land on a usable page.

#### Scenario: Authenticated request to /settings is redirected to the Profile tab

- **WHEN** a signed-in user requests `/settings`
- **THEN** the response redirects to `/settings/profile`

### Requirement: Account tab hosts the Remove account form

The system SHALL render the Danger zone heading and the Remove account form on `/settings/account`. The Profile section and the Email section MUST NOT be rendered on this route.

#### Scenario: Signed-in user sees the Remove account form on /settings/account

- **WHEN** a signed-in user requests `/settings/account`
- **THEN** the page renders the Danger zone heading and the Remove account form
- **AND** the page does not render the Profile section or the Email section

## MODIFIED Requirements

### Requirement: Settings page is auth-gated

The system SHALL require an authenticated session to view any `/settings/*` route, including the bare `/settings` redirect, `/settings/profile`, and `/settings/account`. Unauthenticated requests MUST be redirected to `/authenticate`. The auth gate is enforced once at the `app/settings/layout.tsx` level so every sub-route inherits the same protection.

#### Scenario: Authenticated request to /settings is redirected to /settings/profile

- **WHEN** a signed-in user requests `/settings`
- **THEN** the response redirects to `/settings/profile`

#### Scenario: Authenticated request to /settings/profile renders Profile and Email

- **WHEN** a signed-in user requests `/settings/profile`
- **THEN** the page renders the Profile section and the Email section

#### Scenario: Unauthenticated request to any /settings route is redirected

- **WHEN** an unauthenticated request reaches `/settings`, `/settings/profile`, or `/settings/account`
- **THEN** the response redirects to `/authenticate`

### Requirement: Remove account permanently deletes the user and all associated data

The system SHALL allow a signed-in user to remove their own account from the Account tab at `/settings/account`. Removal MUST permanently delete the user's record and all of the following associated rows in a single atomic operation: every `notes` row owned by the user, every `session` row for the user, and every `account` row for the user. The deletion MUST be rolled back as a unit if any step fails.

#### Scenario: User removes account with confirmed email

- **WHEN** a signed-in user opens the Remove account modal on `/settings/account`, types their exact email address, and submits the confirmation
- **THEN** the system deletes the user's account and every `notes`, `session`, and `account` row owned by them, signs the user out, and redirects them to `/`
- **AND** subsequently `/dashboard` redirects unauthenticated requests to `/authenticate`, any previously-public note URLs (`/p/<slug>`) return 404, and signing in with the same email and password no longer succeeds

#### Scenario: Confirmation email does not match

- **WHEN** the user submits a confirmation value that does not exactly match their session email
- **THEN** the system returns an inline error, makes no database changes, and the session remains active

#### Scenario: Database failure during deletion

- **WHEN** any individual delete fails inside the deletion transaction
- **THEN** the system rolls back the transaction, leaves the user's account and all associated rows intact, and surfaces an error to the form

### Requirement: Settings page renders a Profile section

The system SHALL render a Profile section on `/settings/profile` for any signed-in user. The section MUST display three editable inputs: Name (text), Gender (dropdown), and Birthday (date picker). Each input MUST be prefilled with the user's currently persisted value, including the user's existing `name`. The section MUST NOT be rendered for unauthenticated visitors (the `/settings` layout's auth gate redirects them).

#### Scenario: Signed-in user sees a prefilled Profile section

- **WHEN** a signed-in user requests `/settings/profile`
- **THEN** the page renders a Profile section displaying inputs for Name, Gender, and Birthday, each populated with the user's currently stored value (or empty for fields that have never been saved)

#### Scenario: Profile section is below the page heading and above Email on the Profile tab

- **WHEN** the `/settings/profile` page renders for a signed-in user
- **THEN** the visual order on the page is: page heading, Profile section, Email section
- **AND** the Danger zone is not rendered on this route
