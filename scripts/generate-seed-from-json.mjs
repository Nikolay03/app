import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function sqlValue(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error(`Invalid number: ${v}`);
    return String(v);
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return `'${v.replaceAll("'", "''")}'`;
  if (v instanceof Date) return `'${v.toISOString()}'`;
  // JSON sometimes contains numeric strings; keep as string if provided as string.
  throw new Error(`Unsupported value type: ${typeof v}`);
}

function readJsonArray(filePath) {
  const full = path.resolve(root, filePath);
  const raw = fs.readFileSync(full, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error(`${filePath} must be an array`);
  return data;
}

function buildInsert({ table, columns, rows }) {
  // Keep the seed format simple and human-readable.
  const colsSql = columns.join(", ");
  const valuesSql = rows
    .map((row) => {
      const tuple = columns.map((c) => sqlValue(row[c]));
      return `  (${tuple.join(", ")})`;
    })
    .join(",\n");

  return `insert into public.${table} (${colsSql}) values\n${valuesSql};`;
}

function main() {
  const invoices = readJsonArray("invoices.json");
  const orders = readJsonArray("orders.json");

  const invoiceColumns = [
    "invoice_id",
    "customer_name",
    "customer_email",
    "invoice_date",
    "due_date",
    "amount",
    "tax",
    "total",
    "status",
    "payment_method",
    "notes",
  ];

  const orderColumns = [
    "order_id",
    "customer_name",
    "customer_phone",
    "order_date",
    "shipping_address",
    "items_count",
    "subtotal",
    "shipping_cost",
    "discount",
    "total",
    "status",
    "tracking_number",
    "estimated_delivery",
  ];

  const header =
    "-- Auto-generated from provided JSON files\n" +
    "-- Do not edit manually; run: npm run seed:generate\n\n";

  const seedSql =
    header +
    "truncate table public.invoices, public.orders;\n\n" +
    buildInsert({ table: "invoices", columns: invoiceColumns, rows: invoices }) +
    "\n\n" +
    buildInsert({ table: "orders", columns: orderColumns, rows: orders }) +
    "\n";

  fs.writeFileSync(path.resolve(root, "supabase/seed.sql"), seedSql, "utf8");

  process.stdout.write(
    "Wrote supabase/seed.sql\n"
  );
}

main();
