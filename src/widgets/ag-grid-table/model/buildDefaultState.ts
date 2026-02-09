"use client";

import type { ColDef, ColumnState } from "ag-grid-community";
import type { GridState } from "./types";

export function buildDefaultState<T>(columnDefs: ColDef<T>[]): GridState {
  const columnState: ColumnState[] = columnDefs.map((col) => ({
    colId: col.field ?? col.colId ?? "",
    hide: Boolean(col.hide),
  }));

  return {
    columnState,
    sortModel: [],
    filterModel: null,
  };
}
