## Requirements

### Requirement: Help page is publicly accessible

The system SHALL serve a help page at `/help` without requiring authentication.

#### Scenario: Unauthenticated user visits /help

- **WHEN** any user navigates to `/help`
- **THEN** the page renders with no redirect or auth check

### Requirement: Help page displays feature documentation

The system SHALL display documentation covering the app's core features: note creation, rich text editing, and public sharing.

#### Scenario: User views help content

- **WHEN** a user visits `/help`
- **THEN** the page displays sections covering how to create notes, how to use rich text editing, and how to share notes publicly

### Requirement: Help page links back to the welcome page

The system SHALL provide a navigation link from `/help` back to the home page.

#### Scenario: User navigates home from help

- **WHEN** a user clicks the home/back link on the help page
- **THEN** the user is taken to `/`
