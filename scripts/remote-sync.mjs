import { spawnSync } from "node:child_process";
import fs from "node:fs";

function run(cmd, args) {
  const pretty = [cmd, ...args].join(" ");
  process.stdout.write(`\n> ${pretty}\n`);

  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) process.exit(res.status);
}

function readLinkedProjectRef() {
  try {
    const ref = fs.readFileSync("supabase/.temp/project-ref", "utf8").trim();
    return ref || null;
  } catch {
    return null;
  }
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write(
    [
      "Sync schema + seed to the linked remote Supabase project.",
      "",
      "Usage:",
      "  npm run supabase:remote:sync",
      "",
      "Required env:",
      "  SUPABASE_DB_PASSWORD   Remote Postgres password (Project Settings -> Database).",
      "",
      "Prereqs:",
      "  - `supabase login` done (access token).",
      "  - Project is linked (`supabase link`).",
      "",
      "What it does:",
      "  1) Regenerates supabase/seed.sql from invoices.json + orders.json",
      "  2) Runs `supabase db push --include-seed` against the linked project",
      "",
      "Warning:",
      "  supabase/seed.sql truncates public.invoices and public.orders.",
      "",
    ].join("\n")
  );
  process.exit(0);
}

const projectRef = readLinkedProjectRef();
if (!projectRef) {
  process.stderr.write(
    "Not linked to a Supabase project. Run: supabase link --project-ref <ref>\n"
  );
  process.exit(2);
}

const password = process.env.SUPABASE_DB_PASSWORD?.trim();
if (!password) {
  process.stderr.write(
    [
      "Missing SUPABASE_DB_PASSWORD.",
      "Set it in your shell (PowerShell):",
      "  $env:SUPABASE_DB_PASSWORD = \"...\"",
      "",
    ].join("\n")
  );
  process.exit(2);
}

run(process.execPath, ["scripts/generate-seed-from-json.mjs"]);
run("supabase", ["db", "push", "--include-seed", "--linked", "--yes", "--password", password]);

