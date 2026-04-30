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
The system SHALL require an authenticated session to view `/settings`. Unauthenticated requests MUST be redirected to `/authenticate`.

#### Scenario: Authenticated request loads the settings page
- **WHEN** a signed-in user requests `/settings`
- **THEN** the page renders, displaying the user's email address and an account-removal form

#### Scenario: Unauthenticated request is redirected
- **WHEN** an unauthenticated request reaches `/settings`
- **THEN** the response redirects to `/authenticate`

### Requirement: Remove account permanently deletes the user and all associated data
The system SHALL allow a signed-in user to remove their own account. Removal MUST permanently delete the user's record and all of the following associated rows in a single atomic operation: every `notes` row owned by the user, every `session` row for the user, and every `account` row for the user. The deletion MUST be rolled back as a unit if any step fails.

#### Scenario: User removes account with confirmed email
- **WHEN** a signed-in user opens the Remove account modal on `/settings`, types their exact email address, and submits the confirmation
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
