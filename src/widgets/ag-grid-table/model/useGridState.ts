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

export function useGridState<T>({ columnDefs, gridRef }: Params<T>) {
  const defaultState = useMemo(
    () => buildDefaultState(columnDefs),
    [columnDefs]
  );

  const lastSavedSerializedRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);
  const [dirty, setDirty] = useState(false);

  const serializeState = useCallback((state: GridState) => {
    return JSON.stringify(state);
  }, []);

  useEffect(() => {
    lastSavedSerializedRef.current = serializeState(defaultState);
  }, [defaultState, serializeState]);

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
  }, [captureState, serializeState]);

  const markSaved = useCallback(
    (state: GridState) => {
      lastSavedSerializedRef.current = serializeState(state);
      setDirty(false);
    },
    [serializeState]
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
  };
}
