"use client";

import type { ColumnState, SortModelItem } from "ag-grid-community";

function hasSortState(columnState: ColumnState[]) {
  return columnState.some((col) => col.sort != null);
}

export function mergeSortIntoColumnState(
  columnState: ColumnState[],
  sortModel: SortModelItem[]
) {
  if (sortModel.length === 0 || hasSortState(columnState)) {
    return columnState;
  }

  const sortLookup = new Map(
    sortModel.map((item, index) => [
      item.colId,
      { sort: item.sort, sortIndex: index },
    ])
  );

  return columnState.map((col) => {
    const sortState = sortLookup.get(col.colId);
    if (!sortState) {
      return col;
    }
    return {
      ...col,
      sort: sortState.sort,
      sortIndex: sortState.sortIndex,
    };
  });
}
