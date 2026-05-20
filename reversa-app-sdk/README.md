# Reversa ChatGPT App

Reversa is a ChatGPT App scaffold for helping developers adopt the Reversa reverse-engineering workflow. It exposes MCP tools that explain the workflow, generate an adoption plan, and build an install checklist before the user runs the Reversa CLI in their own development environment.

This app does not claim direct access to a user's local repository. It is review-safe by design: tools compute guidance from user-provided project context and do not write files, execute commands, or connect to third-party systems.

## Tools

- `show_reversa_overview`: returns the Reversa workflow phases and renders the dashboard widget.
- `plan_reversa_adoption`: returns a project-specific adoption plan.
- `generate_reversa_install_checklist`: returns a preflight and install checklist.

All tools are read-only and include `readOnlyHint`, `destructiveHint`, and `openWorldHint` annotations.

## Local Development

```powershell
npm install
npm run check
npm start
```

Local MCP endpoint:

```text
http://localhost:8787/mcp
```

For public review, deploy this server behind HTTPS and set:

```powershell
$env:PUBLIC_ORIGIN = "https://your-public-domain.example"
```

## Submission Notes

- Category: Coding
- Public MCP URL: replace after deployment
- Authentication: none for this guidance-only MVP
- Data handling: user-provided project metadata only
- Destructive behavior: none
- External writes: none

## Official Docs Used

- https://developers.openai.com/apps-sdk
- https://developers.openai.com/apps-sdk/quickstart
- https://developers.openai.com/apps-sdk/build/mcp-server
- https://developers.openai.com/apps-sdk/deploy/submission
- https://help.openai.com/en/articles/20001040-submitting-apps-to-the-chatgpt-app-directory
