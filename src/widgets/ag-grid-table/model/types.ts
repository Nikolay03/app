"use client";

import type { ColumnState, SortModelItem } from "ag-grid-community";

export type GridState = {
  columnState: ColumnState[];
  sortModel: SortModelItem[];
  filterModel: Record<string, unknown> | null;
};
