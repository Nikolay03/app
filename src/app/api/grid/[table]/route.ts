import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";

const ALLOWED_TABLES = new Set(["invoices", "orders"]);

type SortModelItem = { colId?: string; sort?: "asc" | "desc" };

type PostgrestQb = {
  order: (column: string, opts?: { ascending?: boolean }) => PostgrestQb;
  eq: (column: string, value: unknown) => PostgrestQb;
  neq: (column: string, value: unknown) => PostgrestQb;
  ilike: (column: string, pattern: string) => PostgrestQb;
  gt: (column: string, value: unknown) => PostgrestQb;
  gte: (column: string, value: unknown) => PostgrestQb;
  lt: (column: string, value: unknown) => PostgrestQb;
  lte: (column: string, value: unknown) => PostgrestQb;
  in: (column: string, values: unknown[]) => PostgrestQb;
  range: (from: number, to: number) => PostgrestQb;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function asInt(v: unknown, fallback: number) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function applySort(qb: PostgrestQb, sortModel: unknown) {
  if (!Array.isArray(sortModel)) return qb;
  for (const raw of sortModel as SortModelItem[]) {
    const colId = raw?.colId;
    const sort = raw?.sort;
    if (typeof colId !== "string" || (sort !== "asc" && sort !== "desc")) {
      continue;
    }
    qb = qb.order(colId, { ascending: sort === "asc" });
  }
  return qb;
}

function applyFilter(qb: PostgrestQb, filterModel: unknown) {
  if (!isRecord(filterModel)) return qb;

  const normalizeDateOnly = (v: string) => {
    // DB columns are `date` (not timestamptz). AG Grid sometimes sends
    // "YYYY-MM-DD 00:00:00" (or ISO). Normalize to "YYYY-MM-DD".
    const s = v.trim();
    if (s.length >= 10) return s.slice(0, 10);
    return s;
  };

  for (const [col, raw] of Object.entries(filterModel)) {
    if (!raw) continue;
    const model = raw as Record<string, unknown>;
    const filterType = model.filterType ?? "text";

    // Minimal support for the app's needs (text/number/date/set).
    if (filterType === "text") {
      const v = typeof model.filter === "string" ? model.filter.trim() : "";
      if (!v) continue;
      const t = model.type ?? "contains";
      if (t === "equals") qb = qb.eq(col, v);
      else if (t === "notEqual") qb = qb.neq(col, v);
      else if (t === "startsWith") qb = qb.ilike(col, `${v}%`);
      else if (t === "endsWith") qb = qb.ilike(col, `%${v}`);
      else qb = qb.ilike(col, `%${v}%`);
      continue;
    }

    if (filterType === "number") {
      const n = Number(model.filter);
      if (!Number.isFinite(n)) continue;
      const t = model.type ?? "equals";
      if (t === "notEqual") qb = qb.neq(col, n);
      else if (t === "greaterThan") qb = qb.gt(col, n);
      else if (t === "greaterThanOrEqual") qb = qb.gte(col, n);
      else if (t === "lessThan") qb = qb.lt(col, n);
      else if (t === "lessThanOrEqual") qb = qb.lte(col, n);
      else qb = qb.eq(col, n);
      continue;
    }

    if (filterType === "date") {
      const vRaw =
        typeof model.dateFrom === "string"
          ? model.dateFrom
          : typeof model.filter === "string"
            ? model.filter
            : "";
      const v = vRaw ? normalizeDateOnly(vRaw) : "";
      if (!v) continue;
      const t = model.type ?? "equals";
      if (t === "greaterThan") qb = qb.gt(col, v);
      else if (t === "greaterThanOrEqual") qb = qb.gte(col, v);
      else if (t === "lessThan") qb = qb.lt(col, v);
      else if (t === "lessThanOrEqual") qb = qb.lte(col, v);
      else qb = qb.eq(col, v);
      continue;
    }

    if (filterType === "set") {
      const values = Array.isArray(model.values) ? model.values : null;
      if (!values || values.length === 0) continue;
      qb = qb.in(col, values);
      continue;
    }
  }

  return qb;
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ table: string }> }
) {
  const { table } = await ctx.params;

  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const bodyRec = isRecord(body) ? body : {};
  const startRow = Math.max(0, asInt(bodyRec.startRow, 0));
  const endRow = Math.max(startRow + 1, asInt(bodyRec.endRow, startRow + 100));

  // SSRM sends an exclusive endRow, PostgREST uses inclusive.
  const to = endRow - 1;

  // This endpoint intentionally supports only the flat table case.
  const rowGroupCols = bodyRec.rowGroupCols;
  const groupKeys = bodyRec.groupKeys;
  if (
    (Array.isArray(rowGroupCols) && rowGroupCols.length > 0) ||
    (Array.isArray(groupKeys) && groupKeys.length > 0)
  ) {
    return NextResponse.json(
      { error: "Row grouping is not supported" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  let qb = supabase.from(table).select("*", { count: "exact" }) as unknown as PostgrestQb;
  qb = applyFilter(qb, bodyRec.filterModel);
  qb = applySort(qb, bodyRec.sortModel);
  qb = qb.range(startRow, to);

  const { data, error, count } = await (qb as unknown as Promise<{
    data: unknown[] | null;
    error: { message: string } | null;
    count: number | null;
  }>);
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    rows: data ?? [],
    lastRow: typeof count === "number" ? count : null,
  });
}
