## Why

The welcome page currently offers only Log in and Sign up actions, with no way for new or prospective users to learn how the app works. Adding a Help link and page gives users a place to understand the app's features before signing up.

## What Changes

- Add a "Help" link to the welcome page (`/`) in the top-right corner.
- Create a new `/help` page that explains the app's key features: note creation, rich text editing, and public sharing via shareable links.

## Capabilities

### New Capabilities

- `help-page`: A static, publicly accessible page at `/help` that documents the app's features and how to use them.

### Modified Capabilities

- `welcome-page`: The welcome page gains a Help navigation link pointing to `/help`.

## Impact

- New file: `app/help/page.tsx`
- Modified file: `app/page.tsx` (add Help link)
- No database, auth, or API changes required.
