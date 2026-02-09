#!/usr/bin/env node
/**
 * Minimal MCP probe for local development.
 *
 * Why this exists:
 * - In this repo MCP servers are configured for VS Code in `.vscode/mcp.json`.
 * - This script proves we can connect to those servers and list their tools/resources
 *   outside the editor, which is useful for debugging and for CI-friendly checks.
 */

import fs from "node:fs/promises";
import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const repoRoot = process.cwd();
const configPath = path.join(repoRoot, ".vscode", "mcp.json");

function clientForServer(name) {
  return new Client(
    { name: `mcp-probe(${name})`, version: "0.0.0" },
    { capabilities: {} }
  );
}

async function probeServer(name, def) {
  const client = clientForServer(name);

  if (def.type === "stdio") {
    const [command, ...argsFromConfig] = [def.command, ...(def.args ?? [])];
    const transport = new StdioClientTransport({
      command,
      args: argsFromConfig,
    });
    await client.connect(transport);
  } else if (def.type === "http") {
    const supabaseToken =
      process.env.SUPABASE_ACCESS_TOKEN ||
      process.env.SUPABASE_MCP_TOKEN ||
      process.env.SUPABASE_TOKEN;

    const headers =
      name === "supabase" && supabaseToken
        ? { authorization: `Bearer ${supabaseToken}` }
        : undefined;

    const transport = new StreamableHTTPClientTransport(def.url, {
      requestInit: headers ? { headers } : undefined,
    });
    await client.connect(transport);
  } else {
    throw new Error(`Unsupported server type: ${def.type}`);
  }

  const tools = await client.listTools().catch(() => ({ tools: [] }));
  const resources = await client
    .listResources()
    .catch(() => ({ resources: [] }));
  const templates = await client
    .listResourceTemplates()
    .catch(() => ({ resourceTemplates: [] }));

  await client.close();

  return {
    tools: (tools.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? "",
    })),
    resources: (resources.resources ?? []).map((r) => ({
      uri: r.uri,
      name: r.name ?? "",
      description: r.description ?? "",
    })),
    resourceTemplates: (templates.resourceTemplates ?? []).map((rt) => ({
      uriTemplate: rt.uriTemplate,
      name: rt.name ?? "",
      description: rt.description ?? "",
    })),
  };
}

async function main() {
  const raw = await fs.readFile(configPath, "utf8").catch(() => "");
  if (!raw) {
    console.error(`MCP config not found: ${configPath}`);
    process.exit(2);
  }

  const parsed = JSON.parse(raw);
  const servers = parsed?.servers ?? {};

  const entries = await Promise.all(
    Object.entries(servers).map(async ([name, def]) => {
      try {
        const data = await probeServer(name, def);
        return [name, data];
      } catch (err) {
        return [
          name,
          {
            error: String(err?.message ?? err),
          },
        ];
      }
    })
  );
  const results = Object.fromEntries(entries);

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
