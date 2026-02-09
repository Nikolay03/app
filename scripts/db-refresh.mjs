import { spawnSync } from "node:child_process";

function run(cmd, args) {
  const pretty = [cmd, ...args].join(" ");
  process.stdout.write(`\n> ${pretty}\n`);

  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (res.error) {
    throw res.error;
  }
  if (typeof res.status === "number" && res.status !== 0) {
    process.exit(res.status);
  }
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write(
    [
      "Refresh local Supabase DB (migrations + seed).",
      "",
      "Usage:",
      "  npm run db:refresh",
      "",
      "Options:",
      "  --no-start   Skip `supabase start` (assume it's already running).",
      "",
      "Notes:",
      "  - Requires Docker Desktop running for `supabase start`.",
      "",
    ].join("\n")
  );
  process.exit(0);
}

// One-command local refresh:
// 1) ensure local Supabase is running
// 2) regenerate supabase/seed.sql from JSON
// 3) reset DB (migrations + seed)
if (!process.argv.includes("--no-start")) {
  run("supabase", ["start"]);
}
run(process.execPath, ["scripts/generate-seed-from-json.mjs"]);
run("supabase", ["db", "reset", "--yes"]);
