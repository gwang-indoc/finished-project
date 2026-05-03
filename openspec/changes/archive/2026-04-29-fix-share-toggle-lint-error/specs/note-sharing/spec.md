## ADDED Requirements

### Requirement: Public note URL renders without SSR/CSR hydration mismatch

The system SHALL render the absolute public URL on the share toggle only after the client has hydrated. The server-rendered HTML and the client's first paint MUST NOT include the absolute URL, so React hydration completes without a content-mismatch warning.

#### Scenario: Public URL is hidden during SSR and the client's first paint

- **WHEN** the share toggle is rendered on the server, or on the client before hydration completes
- **THEN** the public URL block (the read-only URL input and the Copy button) is not rendered

#### Scenario: Public URL appears after hydration when sharing is enabled

- **WHEN** sharing is enabled, the note has a public slug, and the client has hydrated
- **THEN** the share toggle renders the absolute public URL formatted as `<window.location.origin>/p/<slug>` in the read-only input, and the Copy button writes that same URL to the clipboard
