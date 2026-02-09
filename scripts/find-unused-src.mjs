#!/usr/bin/env node
/**
 * Best-effort unused-file detector for this Next.js (App Router) repo.
 *
 * Notes:
 * - Treats `src/app/**` and `src/proxy.ts` as graph roots (Next entrypoints).
 * - Resolves TS/JS imports (relative and `@/*` alias) to concrete files.
 * - Does not try to understand runtime-only references (e.g. string-based requires).
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".jsx"];

async function listFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await listFiles(p)));
    } else if (e.isFile()) {
      out.push(p);
    }
  }
  return out;
}

function isSourceFile(p) {
  if (p.endsWith(".d.ts")) return false;
  return EXTENSIONS.some((ext) => p.endsWith(ext));
}

function toPosix(p) {
  return p.replaceAll(path.sep, "/");
}

function fromAlias(spec) {
  if (spec.startsWith("@/")) {
    return path.join(SRC, spec.slice(2));
  }
  return null;
}

async function fileExists(p) {
  try {
    const st = await fs.stat(p);
    return st.isFile();
  } catch {
    return false;
  }
}

async function resolveImport(fromFile, spec) {
  // Ignore package imports
  if (!spec.startsWith(".") && !spec.startsWith("@/")) return null;

  const base = spec.startsWith("@/")
    ? fromAlias(spec)
    : path.resolve(path.dirname(fromFile), spec);
  if (!base) return null;

  // Direct file with extension
  if (path.extname(base)) {
    return (await fileExists(base)) ? base : null;
  }

  // Try with extensions
  for (const ext of EXTENSIONS) {
    const p = `${base}${ext}`;
    if (await fileExists(p)) return p;
  }

  // Try as directory index
  for (const ext of EXTENSIONS) {
    const p = path.join(base, `index${ext}`);
    if (await fileExists(p)) return p;
  }

  return null;
}

const IMPORT_RE =
  /(?:import\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?|export\s+(?:type\s+)?\*\s+from\s+)\s*["']([^"']+)["']/g;

async function parseImports(filePath) {
  const code = await fs.readFile(filePath, "utf8").catch(() => "");
  const specs = [];
  let m;
  while ((m = IMPORT_RE.exec(code))) {
    specs.push(m[1]);
  }
  return specs;
}

async function main() {
  const all = (await listFiles(SRC)).filter(isSourceFile);

  const roots = [];
  for (const p of all) {
    const rel = path.relative(SRC, p);
    if (rel.startsWith(`app${path.sep}`)) roots.push(p);
  }
  const proxy = path.join(SRC, "proxy.ts");
  if (await fileExists(proxy)) roots.push(proxy);

  const allSet = new Set(all.map((p) => path.resolve(p)));
  const seen = new Set();
  const queue = [...new Set(roots.map((p) => path.resolve(p)))];

  while (queue.length) {
    const file = queue.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);

    const specs = await parseImports(file);
    for (const spec of specs) {
      const resolved = await resolveImport(file, spec);
      if (!resolved) continue;
      const abs = path.resolve(resolved);
      if (!allSet.has(abs)) continue;
      if (!seen.has(abs)) queue.push(abs);
    }
  }

  const unused = [...allSet].filter((p) => !seen.has(p));
  const report = {
    roots: roots.map((p) => toPosix(path.relative(ROOT, p))),
    totalSourceFiles: all.length,
    reachable: seen.size,
    unused: unused.map((p) => toPosix(path.relative(ROOT, p))).sort(),
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(unused.length ? 2 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
