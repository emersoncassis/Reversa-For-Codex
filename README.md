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

For OpenAI review, deploy the server behind HTTPS, publish privacy and terms pages, update `reversa-app-sdk/chatgpt-app-submission.json`, and submit from the OpenAI Platform dashboard.
