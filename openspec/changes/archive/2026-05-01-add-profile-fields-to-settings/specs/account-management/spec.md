## ADDED Requirements

### Requirement: Settings page renders a Profile section

The system SHALL render a Profile section on `/settings` for any signed-in user. The section MUST appear above the existing Email section and MUST display three editable inputs: Name (text), Gender (dropdown), and Birthday (date picker). Each input MUST be prefilled with the user's currently persisted value, including the user's existing `name`. The section MUST NOT be rendered for unauthenticated visitors (the page redirects them per the existing auth-gate requirement).

#### Scenario: Signed-in user sees a prefilled Profile section

- **WHEN** a signed-in user requests `/settings`
- **THEN** the page renders a Profile section above the Email section, displaying inputs for Name, Gender, and Birthday, each populated with the user's currently stored value (or empty for fields that have never been saved)

#### Scenario: Profile section is below the page heading and above Email

- **WHEN** the Settings page renders for a signed-in user
- **THEN** the visual order from top to bottom is: page heading, Profile section, Email section, Danger zone

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
