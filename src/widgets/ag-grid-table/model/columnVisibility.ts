"use client";

import type { GridApi } from "ag-grid-community";

export function readHiddenByColId(api: GridApi): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const s of api.getColumnState()) {
    if (s.colId) next[s.colId] = Boolean(s.hide);
  }
  return next;
}

export function setColumnVisible(api: GridApi, colId: string, visible: boolean) {
  const known = api.getColumnState().some((s) => s.colId === colId);
  api.setColumnsVisible([colId], visible);
  return known;
}

export function setColumnsVisible(
  api: GridApi,
  colIds: string[],
  visible: boolean
) {
  const knownColIds = new Set(
    api
      .getColumnState()
      .map((s) => s.colId)
      .filter((id): id is string => Boolean(id))
  );

  api.setColumnsVisible(colIds, visible);
  return colIds.every((id) => knownColIds.has(id));
}
