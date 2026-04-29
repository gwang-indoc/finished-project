## RENAMED Requirements

- FROM: `### Requirement: Welcome page includes a Help link in the top-right corner`
- TO: `### Requirement: Welcome page includes a Help link in the bottom-right corner`

## MODIFIED Requirements

### Requirement: Welcome page includes a Help link in the bottom-right corner
The system SHALL display a Help link in the bottom-right corner of the welcome page, visually separate from the Log in and Sign up buttons.

#### Scenario: User sees Help link on welcome page
- **WHEN** a user visits `/`
- **THEN** the page displays a Help link in the bottom-right corner, distinct from the Log in and Sign up buttons

#### Scenario: Help link navigates to help page
- **WHEN** a user clicks the Help link on the welcome page
- **THEN** the user is taken to `/help`
