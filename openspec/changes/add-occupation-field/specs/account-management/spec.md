## MODIFIED Requirements

### Requirement: Settings page renders a Profile section

The system SHALL render a Profile section on `/settings/profile` for any signed-in user. The section MUST display four editable inputs: Name (text), Gender (dropdown), Birthday (date picker), and Occupation (text). Each input MUST be prefilled with the user's currently persisted value, including the user's existing `name`. Occupation MUST be optional — the field MAY be left blank. The section MUST NOT be rendered for unauthenticated visitors (the `/settings` layout's auth gate redirects them).

#### Scenario: Signed-in user sees a prefilled Profile section

- **WHEN** a signed-in user requests `/settings/profile`
- **THEN** the page renders a Profile section displaying inputs for Name, Gender, Birthday, and Occupation, each populated with the user's currently stored value (or empty for fields that have never been saved)

#### Scenario: Profile section is below the page heading and above Email on the Profile tab

- **WHEN** the `/settings/profile` page renders for a signed-in user
- **THEN** the visual order on the page is: page heading, Profile section, Email section
- **AND** the Danger zone is not rendered on this route

### Requirement: Profile updates require valid name, gender, birthday, and optional occupation

The system SHALL provide a single "Save profile" action that updates the user's `name`, `gender`, `birthday`, and `occupation` together. Submission MUST be rejected unless ALL of the following hold: `name` is a non-empty string after trim and at most 100 characters; `gender` is one of `male`, `female`, `non-binary`, or `prefer-not-to-say`; `birthday` matches `YYYY-MM-DD`, parses to a valid calendar date, falls on or after `1900-01-01`, and is not in the future. `occupation` is optional — when provided it MUST be at most 100 characters after trim; an empty submission is stored as NULL. Rejection MUST surface inline field-level errors and MUST make no database changes.

#### Scenario: Valid submission with occupation persists all four fields

- **WHEN** a signed-in user submits the Profile form with `name = "Jane Doe"`, `gender = "female"`, `birthday = "1990-06-15"`, and `occupation = "Software Engineer"`
- **THEN** the system updates the user's row in `user` so `name`, `gender`, `birthday`, and `occupation` reflect the submitted values
- **AND** the form displays a "Saved" indicator on success

#### Scenario: Valid submission without occupation stores NULL

- **WHEN** a signed-in user submits the Profile form with `name = "Jane Doe"`, `gender = "female"`, `birthday = "1990-06-15"`, and an empty `occupation`
- **THEN** the system persists `occupation = NULL` for that user and displays a "Saved" indicator on success

#### Scenario: Missing field is rejected with an inline error

- **WHEN** a signed-in user submits the Profile form with `name = "Jane"`, `gender = "female"`, and an empty `birthday`
- **THEN** the system makes no database changes and returns an inline error attached to the Birthday field

#### Scenario: Occupation exceeding 100 characters is rejected

- **WHEN** a signed-in user submits the Profile form with an `occupation` value longer than 100 characters
- **THEN** the system makes no database changes and returns an inline error attached to the Occupation field

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

### Requirement: User schema supports name, gender, birthday, and occupation

The system SHALL persist a user's profile as four columns on the existing `user` table: `name` (already present, NOT NULL), `gender` (TEXT, nullable, value drawn from the gender enum when set), `birthday` (TEXT, nullable, ISO `YYYY-MM-DD` when set), and `occupation` (TEXT, nullable, free text when set). Schema bootstrap MUST be idempotent so that running it against a database that already contains some or all of these columns succeeds without modification.

#### Scenario: Fresh database includes all four profile columns

- **WHEN** the application boots against a database that has no `user` table yet
- **THEN** after bootstrap the `user` table contains `name`, `gender`, `birthday`, and `occupation` columns

#### Scenario: Existing database is augmented idempotently

- **WHEN** the application boots against an existing database whose `user` table lacks `occupation`
- **THEN** after bootstrap the `user` table contains the `occupation` column alongside the original columns
- **AND** booting the application again is a no-op against the now-up-to-date schema

## ADDED Requirements

### Requirement: Profile-update action sanitizes the submitted occupation

The system SHALL sanitize the submitted `occupation` value by stripping all HTML tags before persisting it. An empty value after sanitization MUST be stored as NULL. The persisted value MUST contain no tags from the input, regardless of which tags appeared.

#### Scenario: HTML in occupation is stripped before persist

- **WHEN** a signed-in user submits the Profile form with `occupation = "Engineer <script>alert(1)</script>"`
- **THEN** the value persisted to the user's `occupation` column contains no `<script>` tag and no other HTML tags

#### Scenario: Empty occupation is stored as NULL

- **WHEN** a signed-in user submits the Profile form with an empty `occupation` field
- **THEN** the `occupation` column for that user is set to NULL in the database
