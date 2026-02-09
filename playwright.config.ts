import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// Playwright does not auto-load Next.js env files.
// We load a small set of `.env*` files so local E2E credentials can live in
// `.env.e2e.local` (gitignored by default).
const ORIGINAL_ENV_KEYS = new Set(Object.keys(process.env));

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const eq = normalized.indexOf("=");
    if (eq <= 0) continue;

    const key = normalized.slice(0, eq).trim();
    if (!key) continue;

    let value = normalized.slice(eq + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Never override explicitly-set environment variables.
    if (ORIGINAL_ENV_KEYS.has(key)) continue;
    process.env[key] = value;
  }
}

const root = process.cwd();
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env.e2e"));
loadEnvFile(path.join(root, ".env.e2e.local"));

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: 0,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});

