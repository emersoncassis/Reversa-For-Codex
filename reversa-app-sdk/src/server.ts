import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const WIDGET_URI = "ui://widget/reversa-dashboard-v1.html";
const WIDGET_HTML = readFileSync(path.join(ROOT_DIR, "public", "widget.html"), "utf8");
const PRIVACY_MARKDOWN = readFileSync(path.join(ROOT_DIR, "submission", "privacy.md"), "utf8");
const TERMS_MARKDOWN = readFileSync(path.join(ROOT_DIR, "submission", "terms.md"), "utf8");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const PORT = Number(process.env.PORT ?? "8787");
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN ?? "http://localhost:" + PORT;
const MCP_PATH = "/mcp";

type ReversaPhase = {
  id: string;
  title: string;
  purpose: string;
  output: string;
};

const phases: ReversaPhase[] = [
  {
    id: "reconnaissance",
    title: "Reconnaissance",
    purpose: "Map languages, frameworks, entry points, dependencies, and runtime boundaries.",
    output: "_reversa_sdd/01-surface-map.md",
  },
  {
    id: "excavation",
    title: "Excavation",
    purpose: "Inspect modules, algorithms, flows, data structures, and integration contracts.",
    output: "_reversa_sdd/02-module-analysis.md",
  },
  {
    id: "interpretation",
    title: "Interpretation",
    purpose: "Extract implicit business rules, permissions, state machines, and retroactive ADRs.",
    output: "_reversa_sdd/03-business-knowledge.md",
  },
  {
    id: "generation",
    title: "Generation",
    purpose: "Generate executable specifications with traceability back to code evidence.",
    output: "_reversa_sdd/specs/",
  },
  {
    id: "review",
    title: "Review",
    purpose: "Validate gaps, contradictions, confidence, and regression risks before future coding work.",
    output: "_reversa_sdd/review-report.md",
  },
];

const supportedGoals = ["discovery", "greenfield", "forward", "migration", "docs"] as const;
const supportedEngines = ["codex", "claude-code", "cursor", "gemini-cli", "generic"] as const;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdownPage(title: string, markdown: string): string {
  const body = markdown
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) {
        return "";
      }

      if (trimmed.startsWith("# ")) {
        return "<h1>" + escapeHtml(trimmed.slice(2)) + "</h1>";
      }

      return "<p>" + escapeHtml(trimmed).replace(/\r?\n/g, "<br>") + "</p>";
    })
    .join("\n");

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>" + escapeHtml(title) + "</title>",
    "<style>",
    "body{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;margin:0;background:#f7f5ef;color:#161616}",
    "main{max-width:760px;margin:0 auto;padding:56px 24px}",
    "h1{font-size:32px;line-height:1.2;margin:0 0 24px}",
    "p{font-size:16px;margin:0 0 18px}",
    "a{color:#0b6bcb}",
    "</style>",
    "</head>",
    "<body><main>",
    body,
    "</main></body></html>",
  ].join("");
}

function createAppServer(): McpServer {
  const server = new McpServer({
    name: "reversa",
    version: "0.1.0",
  });

  registerAppResource(server, "reversa-dashboard", WIDGET_URI, {}, async () => ({
    contents: [
      {
        uri: WIDGET_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: WIDGET_HTML,
        _meta: {
          ui: {
            prefersBorder: true,
            domain: PUBLIC_ORIGIN,
            csp: {
              connectDomains: [PUBLIC_ORIGIN],
              resourceDomains: [PUBLIC_ORIGIN],
              imgDomains: [PUBLIC_ORIGIN],
            },
          },
          "openai/widgetDescription":
            "Shows the Reversa workflow phases, install checklist, and generated adoption plan.",
        },
      },
    ],
  }));

  registerAppTool(
    server,
    "show_reversa_overview",
    {
      title: "Show Reversa overview",
      description:
        "Use this when the user wants to understand what Reversa does and see the reverse-engineering workflow.",
      inputSchema: {},
      outputSchema: {
        name: z.string(),
        summary: z.string(),
        phases: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            purpose: z.string(),
            output: z.string(),
          })
        ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/toolInvocation/invoking": "Loading Reversa overview",
        "openai/toolInvocation/invoked": "Reversa overview ready",
      },
    },
    async () => {
      const structuredContent = {
        name: "Reversa",
        summary:
          "Reversa turns legacy systems into executable, traceable specifications that AI coding agents can use safely.",
        phases,
      };

      return {
        structuredContent,
        content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
        },
      };
    }
  );

  registerAppTool(
    server,
    "plan_reversa_adoption",
    {
      title: "Plan Reversa adoption",
      description:
        "Use this when the user describes a project and wants a practical Reversa adoption plan before running the CLI.",
      inputSchema: {
        projectName: z.string().min(1).max(120),
        stack: z.string().min(1).max(300),
        goal: z.enum(supportedGoals),
        riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
        constraints: z.string().max(800).optional(),
      },
      outputSchema: {
        projectName: z.string(),
        goal: z.string(),
        recommendedEntryCommand: z.string(),
        sequence: z.array(z.string()),
        safeguards: z.array(z.string()),
        expectedArtifacts: z.array(z.string()),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/toolInvocation/invoking": "Preparing Reversa plan",
        "openai/toolInvocation/invoked": "Reversa plan ready",
      },
    },
    async ({ projectName, stack, goal, riskLevel, constraints }) => {
      const commandByGoal: Record<(typeof supportedGoals)[number], string> = {
        discovery: "reversa",
        greenfield: "reversa-new",
        forward: "reversa-forward",
        migration: "reversa-migrate",
        docs: "reversa-docs",
      };

      const structuredContent = {
        projectName,
        goal,
        recommendedEntryCommand: commandByGoal[goal],
        sequence: [
          "Commit or back up the project before starting.",
          "Run `npx reversa install` in the project root.",
          "Select Codex and any other engines present in the environment.",
          "Start the selected entry command and advance only after reviewing each checkpoint.",
          "Keep generated output inside `.reversa/` and `_reversa_sdd/` until the specs are reviewed.",
        ],
        safeguards: [
          "Treat source files as read-only during discovery.",
          "Validate generated specs against code evidence before implementation.",
          "Use stricter review when risk is " + riskLevel + ".",
          constraints ? "Constraint to respect: " + constraints : "No extra constraint provided.",
          "Stack context: " + stack,
        ],
        expectedArtifacts: phases.map((phase) => phase.output),
      };

      return {
        structuredContent,
        content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
        },
      };
    }
  );

  registerAppTool(
    server,
    "generate_reversa_install_checklist",
    {
      title: "Generate Reversa install checklist",
      description:
        "Use this when the user is ready to install Reversa and needs a review-safe preflight checklist.",
      inputSchema: {
        engine: z.enum(supportedEngines),
        repositoryState: z.enum(["clean-git", "dirty-git", "no-git", "unknown"]),
        primaryLanguage: z.string().min(1).max(80),
      },
      outputSchema: {
        engine: z.string(),
        command: z.string(),
        preflight: z.array(z.string()),
        installSteps: z.array(z.string()),
        reviewChecks: z.array(z.string()),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/toolInvocation/invoking": "Building install checklist",
        "openai/toolInvocation/invoked": "Install checklist ready",
      },
    },
    async ({ engine, repositoryState, primaryLanguage }) => {
      const structuredContent = {
        engine,
        command: "npx reversa install",
        preflight: [
          "Confirm Node.js 18.20.2 or newer is available.",
          "Confirm the project has a backup or remote copy.",
          repositoryState === "clean-git"
            ? "Git working tree is reported clean."
            : "Resolve or intentionally document current repository state: " + repositoryState + ".",
          "Identify runtime and test commands for the " + primaryLanguage + " project.",
        ],
        installSteps: [
          "Run `npx reversa install` from the project root.",
          "Select `" + engine + "` when prompted for agent engines.",
          "Confirm generated files before starting the first Reversa command.",
        ],
        reviewChecks: [
          "Verify `.reversa/state.json` exists.",
          "Verify generated agent files match the selected engine.",
          "Verify no existing source files were overwritten.",
          "Start with the discovery command before implementation work.",
        ],
      };

      return {
        structuredContent,
        content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
        },
      };
    }
  );

  return server;
}

createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, "http://" + (req.headers.host ?? "localhost"));
  const isMcpRoute = url.pathname === MCP_PATH || url.pathname.startsWith(MCP_PATH + "/");

  if (req.method === "OPTIONS" && isMcpRoute) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify({ name: "reversa", mcp: MCP_PATH, status: "ok" }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/privacy") {
    res
      .writeHead(200, { "content-type": "text/html; charset=utf-8" })
      .end(renderMarkdownPage("Reversa App Privacy Policy", PRIVACY_MARKDOWN));
    return;
  }

  if (req.method === "GET" && url.pathname === "/terms") {
    res
      .writeHead(200, { "content-type": "text/html; charset=utf-8" })
      .end(renderMarkdownPage("Reversa App Terms", TERMS_MARKDOWN));
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/assets/")) {
    const assetPath = path.normalize(path.join(PUBLIC_DIR, url.pathname));
    if (!assetPath.startsWith(path.join(PUBLIC_DIR, "assets"))) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    try {
      const body = readFileSync(assetPath);
      const contentType = assetPath.endsWith(".png") ? "image/png" : "application/octet-stream";
      res.writeHead(200, { "content-type": contentType }).end(body);
    } catch {
      res.writeHead(404).end("Not Found");
    }
    return;
  }

  const transportMethods = new Set(["GET", "POST", "DELETE"]);
  if (isMcpRoute && req.method && transportMethods.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createAppServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Failed to handle MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
}).listen(PORT, () => {
  console.log("Reversa MCP server listening on http://localhost:" + PORT + MCP_PATH);
});
