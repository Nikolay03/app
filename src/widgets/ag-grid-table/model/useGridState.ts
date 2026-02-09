"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import type { GridState } from "./types";
import { buildDefaultState } from "./buildDefaultState";

type Params<T> = {
  columnDefs: ColDef<T>[];
  gridRef: React.RefObject<AgGridReact<T> | null>;
};

function serializeState(state: GridState) {
  return JSON.stringify(state);
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

    return {
      columnState: api.getColumnState(),
      sortModel: api.getState().sort?.sortModel ?? [],
      filterModel: api.getFilterModel(),
    };
  }, [defaultState, gridRef]);

  const applyState = useCallback(
    (state: GridState) => {
      const api = gridRef.current?.api;
      if (!api) {
        return;
      }
      api.applyColumnState({ state: state.columnState, applyOrder: true });
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
