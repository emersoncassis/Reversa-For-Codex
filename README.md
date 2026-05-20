# Reversa For Codex

This repository packages Reversa for Codex and prepares a ChatGPT Apps SDK submission path.

## Contents

- `plugins/reversa/`: local Codex plugin package with Reversa skills and marketplace metadata.
- `reversa-app-sdk/`: ChatGPT Apps SDK MCP server scaffold for review-safe public submission.
- `.agents/plugins/marketplace.json`: repo-local marketplace entry for the Reversa plugin.

## ChatGPT App

The `reversa-app-sdk` project exposes three read-only MCP tools:

- `show_reversa_overview`
- `plan_reversa_adoption`
- `generate_reversa_install_checklist`

Run locally:

```powershell
cd reversa-app-sdk
npm install
npm run validate
npm start
```

Local endpoint:

```text
http://localhost:8787/mcp
```

Production endpoints after deploying with Fly.io:

```text
https://reversa-for-codex.fly.dev/mcp
https://reversa-for-codex.fly.dev/privacy
https://reversa-for-codex.fly.dev/terms
```

For OpenAI review, connect the HTTPS MCP endpoint in ChatGPT Developer Mode, run the review prompts, then submit from the OpenAI Platform dashboard.
