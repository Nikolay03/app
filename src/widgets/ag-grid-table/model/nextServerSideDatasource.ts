"use client";

import type {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";

export type NextGridDatasourceOpts = {
  table: "invoices" | "orders";
  onLoadingChange?: (loading: boolean) => void;
};

type GridRequestBody = {
  startRow: number;
  endRow: number;
  sortModel: unknown;
  filterModel: unknown;
  rowGroupCols?: unknown;
  groupKeys?: unknown;
  valueCols?: unknown;
  pivotCols?: unknown;
  pivotMode?: unknown;
};

function stableStringify(value: unknown): string {
  if (value == null) return "null";
  const t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t === "number" || t === "boolean") return String(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  if (t === "object") {
    const rec = value as Record<string, unknown>;
    const keys = Object.keys(rec).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${stableStringify(rec[k])}`)
      .join(",")}}`;
  }

  // functions/symbols/etc shouldn't appear in AG Grid request models; treat as string fallback.
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isAbortError(err: unknown) {
  // DOMException("AbortError") in browsers; sometimes Error with name.
  return (
    typeof err === "object" &&
    err != null &&
    "name" in err &&
    (err as { name?: unknown }).name === "AbortError"
  );
}

export function createNextServerSideDatasource(
  opts: NextGridDatasourceOpts
): IServerSideDatasource<unknown> {
  // Cancel in-flight requests when the query changes (sort/filter/grouping/etc).
  // This prevents stale/out-of-order responses from overwriting newer grid state.
  let activeQueryKey: string | null = null;
  const inFlight = new Set<{
    controller: AbortController;
    queryKey: string;
    isTopRequest: boolean;
  }>();
  let topInFlightCount = 0;

  const syncLoading = () => {
    opts.onLoadingChange?.(topInFlightCount > 0);
  };

  return {
    async getRows(params: IServerSideGetRowsParams<unknown>) {
      const req = params.request;

      const queryKey = stableStringify({
        sortModel: req.sortModel ?? [],
        filterModel: req.filterModel ?? null,
        rowGroupCols: req.rowGroupCols ?? null,
        groupKeys: req.groupKeys ?? null,
        valueCols: req.valueCols ?? null,
        pivotCols: req.pivotCols ?? null,
        pivotMode: req.pivotMode ?? null,
      });

      if (activeQueryKey !== queryKey) {
        activeQueryKey = queryKey;
        for (const r of inFlight) {
          r.controller.abort();
        }
      }

      const body: GridRequestBody = {
        startRow: req.startRow ?? 0,
        endRow: req.endRow ?? 100,
        sortModel: req.sortModel ?? [],
        filterModel: req.filterModel ?? null,
        rowGroupCols: req.rowGroupCols,
        groupKeys: req.groupKeys,
        valueCols: req.valueCols,
        pivotCols: req.pivotCols,
        pivotMode: req.pivotMode,
      };

      const controller = new AbortController();
      const inFlightItem = {
        controller,
        queryKey,
        isTopRequest: (req.startRow ?? 0) === 0,
      };
      inFlight.add(inFlightItem);
      if (inFlightItem.isTopRequest) {
        topInFlightCount += 1;
        syncLoading();
      }

      try {
        const res = await fetch(`/api/grid/${opts.table}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (controller.signal.aborted || activeQueryKey !== queryKey) {
          // Request became obsolete (new sort/filter/etc). Release the grid request slot.
          params.fail();
          return;
        }

        if (!res.ok) {
          console.error("Grid datasource failed", {
            table: opts.table,
            status: res.status,
          });
          params.fail();
          return;
        }

        const json = (await res.json()) as {
          rows: unknown[];
          lastRow: number | null;
        };

        if (controller.signal.aborted || activeQueryKey !== queryKey) {
          params.fail();
          return;
        }

        params.success({
          rowData: json.rows ?? [],
          rowCount: typeof json.lastRow === "number" ? json.lastRow : undefined,
        });
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) {
          params.fail();
          return;
        }
        if (activeQueryKey !== queryKey) {
          params.fail();
          return;
        }
        console.error("Grid datasource threw", err);
        params.fail();
      } finally {
        inFlight.delete(inFlightItem);
        if (inFlightItem.isTopRequest) {
          topInFlightCount = Math.max(0, topInFlightCount - 1);
          syncLoading();
        }
      }
    },
  };
}
