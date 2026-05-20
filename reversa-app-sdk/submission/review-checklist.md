# Review Checklist

## Before Deployment

- Replace `YOUR_DOMAIN.example` in `submission/app-submission-draft.json`.
- Host the MCP server at a public HTTPS URL.
- Set `PUBLIC_ORIGIN` to the public origin before starting the server.
- Confirm `/mcp` is reachable outside the local network.
- Publish privacy policy and terms pages.

## Tool Safety

- `show_reversa_overview`: read-only, no external writes.
- `plan_reversa_adoption`: read-only, computes a plan from user-provided fields.
- `generate_reversa_install_checklist`: read-only, computes a checklist from user-provided fields.

## Expected Review Tests

- Test the three prompts in `app-submission-draft.json`.
- Verify the widget renders the Reversa logo and workflow data.
- Verify no secrets, local paths, trace ids, logs, or personal identifiers are returned.
- Verify all tool annotations are present and accurate.

## Known Scope

This MVP does not run the Reversa CLI and does not inspect local repositories. That is intentional for public submission safety.
