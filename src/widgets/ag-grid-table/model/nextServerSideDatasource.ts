"use client";

import type {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";

export type NextGridDatasourceOpts = {
  table: "invoices" | "orders";
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

export function createNextServerSideDatasource(
  opts: NextGridDatasourceOpts
): IServerSideDatasource<unknown> {
  return {
    async getRows(params: IServerSideGetRowsParams<unknown>) {
      const req = params.request;

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

      try {
        const res = await fetch(`/api/grid/${opts.table}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });

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

        params.success({
          rowData: json.rows ?? [],
          rowCount: typeof json.lastRow === "number" ? json.lastRow : undefined,
        });
      } catch (err) {
        console.error("Grid datasource threw", err);
        params.fail();
      }
    },
  };
}
