"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { AgGridReact } from "ag-grid-react";
import type { ColDef, ColumnState, SortModelItem } from "ag-grid-community";
import type { GridState } from "./types";
import { buildDefaultState } from "./buildDefaultState";

type Params<T> = {
  columnDefs: ColDef<T>[];
  gridRef: React.RefObject<AgGridReact<T> | null>;
};

function serializeState(state: GridState) {
  return JSON.stringify(state);
}

function sortModelFromColumnState(columnState: GridState["columnState"]) {
  // In v33+, sorting is controlled via Column State. Derive SortModel from it so
  // we save/compare/apply a consistent source of truth.
  return columnState
    .filter((s) => s.sort != null)
    .slice()
    .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    .map(
      (s): SortModelItem => ({
        colId: s.colId,
        sort: s.sort!,
      })
    );
}

function normalizeColumnStateOrder(
  api: { getAllGridColumns?: () => { getColId: () => string }[] },
  columnState: ColumnState[]
) {
  const allCols = api.getAllGridColumns?.();
  if (!allCols || allCols.length === 0) return columnState;

  // `getColumnState()` doesn't always guarantee stable order after UI moves.
  // Normalize to the grid's actual column order before saving/comparing/applying.
  const desiredOrder = allCols.map((c) => c.getColId());
  const byId = new Map(columnState.map((s) => [s.colId, s] as const));

  const reordered: ColumnState[] = [];
  for (const colId of desiredOrder) {
    const s = byId.get(colId);
    if (!s) continue;
    reordered.push(s);
    byId.delete(colId);
  }

  // Keep any unknown columns (should be rare) at the end to avoid dropping state.
  for (const s of byId.values()) {
    reordered.push(s);
  }

  return reordered;
}

export function useGridState<T>({ columnDefs, gridRef }: Params<T>) {
  const derivedDefaultState = useMemo(
    () => buildDefaultState(columnDefs),
    [columnDefs]
  );
  // Default view baseline. We initialize from columnDefs, but we also allow
  // capturing the real grid state on GridReady (includes auto columns, widths).
  const [defaultState, setDefaultState] = useState<GridState>(
    () => derivedDefaultState
  );

  const lastSavedSerializedRef = useRef<string>(
    serializeState(derivedDefaultState)
  );
  const rafRef = useRef<number | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    // If column definitions change (should be rare), reset the baseline default.
    setDefaultState(derivedDefaultState);
  }, [derivedDefaultState]);

  const markDefault = useCallback((state: GridState) => {
    setDefaultState(state);
  }, []);

  const captureState = useCallback((): GridState => {
    const api = gridRef.current?.api;
    if (!api) {
      return defaultState;
    }

    const columnState = normalizeColumnStateOrder(
      api as unknown as { getAllGridColumns?: () => { getColId: () => string }[] },
      api.getColumnState()
    );
    return {
      columnState,
      sortModel: sortModelFromColumnState(columnState),
      filterModel: api.getFilterModel(),
    };
  }, [defaultState, gridRef]);

  const applyState = useCallback(
    (state: GridState) => {
      const api = gridRef.current?.api;
      if (!api) {
        return;
      }
      // Important: Column State APIs interpret `undefined` as "don't change".
      // To ensure switching views clears previous sorting, set a default sort of null.
      api.applyColumnState({
        state: state.columnState,
        applyOrder: true,
        defaultState: { sort: null, sortIndex: null },
      });
      api.setFilterModel(state.filterModel);
    },
    [gridRef]
  );

  const refreshDirty = useCallback(() => {
    if (rafRef.current != null) {
      return;
    }
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const current = captureState();
      const currentSerialized = serializeState(current);
      setDirty(currentSerialized !== lastSavedSerializedRef.current);
    });
  }, [captureState]);

  const markSaved = useCallback(
    (state: GridState) => {
      lastSavedSerializedRef.current = serializeState(state);
      setDirty(false);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    defaultState,
    dirty,
    captureState,
    applyState,
    refreshDirty,
    markSaved,
    markDefault,
  };
}
