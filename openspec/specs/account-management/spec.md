## Requirements
### Requirement: Settings page is reachable via the global header

The system SHALL render a `Settings` link in the global header for any signed-in user, leading to `/settings`. The link MUST NOT be rendered for unauthenticated visitors.

#### Scenario: Signed-in user sees Settings link in the header

- **WHEN** a signed-in user views any page
- **THEN** the global header displays a `Settings` link between the brand and the Logout control, and clicking it navigates to `/settings`

#### Scenario: Unauthenticated visitor does not see Settings link

- **WHEN** an unauthenticated visitor views any page
- **THEN** the global header does not render the `Settings` link

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

### Requirement: Account-removal action trusts the session, not the form

The system SHALL identify the account to remove using the server-side session's user identifier. The form's confirmation value MUST NOT be used as a database lookup key.

#### Scenario: Tampered form submission cannot delete a different user

- **WHEN** an authenticated user submits a confirmation value that matches some other user's email
- **THEN** the action's session-vs-form comparison fails, no database changes occur, and an inline error is returned

### Requirement: Settings page renders a Profile section

The system SHALL render a Profile section on `/settings/profile` for any signed-in user. The section MUST display three editable inputs: Name (text), Gender (dropdown), and Birthday (date picker). Each input MUST be prefilled with the user's currently persisted value, including the user's existing `name`. The section MUST NOT be rendered for unauthenticated visitors (the `/settings` layout's auth gate redirects them).

#### Scenario: Signed-in user sees a prefilled Profile section

- **WHEN** a signed-in user requests `/settings/profile`
- **THEN** the page renders a Profile section displaying inputs for Name, Gender, and Birthday, each populated with the user's currently stored value (or empty for fields that have never been saved)

#### Scenario: Profile section is below the page heading and above Email on the Profile tab

- **WHEN** the `/settings/profile` page renders for a signed-in user
- **THEN** the visual order on the page is: page heading, Profile section, Email section
- **AND** the Danger zone is not rendered on this route

### Requirement: Profile updates require valid name, gender, and birthday

The system SHALL provide a single "Save profile" action that updates the user's `name`, `gender`, and `birthday` together. Submission MUST be rejected unless ALL of the following hold: `name` is a non-empty string after trim and at most 100 characters; `gender` is one of `male`, `female`, `non-binary`, or `prefer-not-to-say`; `birthday` matches `YYYY-MM-DD`, parses to a valid calendar date, falls on or after `1900-01-01`, and is not in the future. Rejection MUST surface inline field-level errors and MUST make no database changes.

#### Scenario: Valid submission persists all three fields

- **WHEN** a signed-in user submits the Profile form with `name = "Jane Doe"`, `gender = "female"`, and `birthday = "1990-06-15"`
- **THEN** the system updates the user's row in `user` so `name`, `gender`, and `birthday` reflect the submitted values
- **AND** the form displays a "Saved" indicator on success

#### Scenario: Missing field is rejected with an inline error

- **WHEN** a signed-in user submits the Profile form with `name = "Jane"`, `gender = "female"`, and an empty `birthday`
- **THEN** the system makes no database changes and returns an inline error attached to the Birthday field

#### Scenario: Gender outside the enum is rejected

- **WHEN** a signed-in user submits the Profile form with a `gender` value that is not one of the four allowed literals
- **THEN** the system makes no database changes and returns an inline error attached to the Gender field

#### Scenario: Birthday in the future is rejected

- **WHEN** a signed-in user submits the Profile form with a `birthday` later than the current date
- **THEN** the system makes no database changes and returns an inline error attached to the Birthday field

#### Scenario: Birthday before 1900-01-01 is rejected

- **WHEN** a signed-in user submits the Profile form with a `birthday` earlier than `1900-01-01`
- **THEN** the system makes no database changes and returns an inline error attached to the Birthday field

#### Scenario: Calendar-invalid birthday is rejected

- **WHEN** a signed-in user submits the Profile form with `birthday = "2026-02-30"` (well-formed but not a real date)
- **THEN** the system makes no database changes and returns an inline error attached to the Birthday field

### Requirement: Profile-update action sanitizes the submitted name

The system SHALL sanitize the submitted `name` value by stripping all HTML tags before persisting it. The persisted value MUST contain no tags from the input, regardless of which tags appeared.

#### Scenario: HTML in the name is stripped before persist

- **WHEN** a signed-in user submits the Profile form with `name = "Jane <script>alert(1)</script> Doe"` and otherwise-valid gender / birthday
- **THEN** the value persisted to the user's `name` column contains no `<script>` tag and no other HTML tags

### Requirement: Profile-update action trusts the session, not the form

The system SHALL identify the user record to update using the server-side session's user identifier. Form-supplied identifiers MUST NOT be used as a database lookup or update key.

#### Scenario: Tampered form submission cannot update a different user

- **WHEN** an authenticated user submits the Profile form with values targeting their session and any extra hidden fields that name a different user identifier
- **THEN** the action updates only the row identified by `session.user.id` and ignores any user identifier coming from the form

### Requirement: Profile-update action redirects unauthenticated requests

The system SHALL require an authenticated session for the Profile-update action. Unauthenticated invocations MUST be redirected to `/authenticate` and MUST NOT make any database changes.

#### Scenario: Unauthenticated request to the action is redirected

- **WHEN** an unauthenticated request submits the Profile form
- **THEN** the response redirects to `/authenticate` and the database is unchanged

### Requirement: User schema supports name, gender, and birthday

The system SHALL persist a user's profile as three columns on the existing `user` table: `name` (already present, NOT NULL), `gender` (TEXT, nullable, value drawn from the gender enum when set), and `birthday` (TEXT, nullable, ISO `YYYY-MM-DD` when set). Schema bootstrap MUST be idempotent so that running it against a database that already contains some or all of these columns succeeds without modification.

#### Scenario: Fresh database includes all three profile columns

- **WHEN** the application boots against a database that has no `user` table yet
- **THEN** after bootstrap the `user` table contains `name`, `gender`, and `birthday` columns

#### Scenario: Existing database is augmented idempotently

- **WHEN** the application boots against an existing database whose `user` table predates this change and lacks `gender` and `birthday`
- **THEN** after bootstrap the `user` table contains `gender` and `birthday` columns alongside the original columns
- **AND** booting the application again is a no-op against the now-up-to-date schema

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

