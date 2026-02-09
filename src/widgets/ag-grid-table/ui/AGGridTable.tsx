"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  ColumnState,
  GridReadyEvent,
  SortModelItem,
} from "ag-grid-community";
import { createClient } from "@/shared/lib/supabase/browser";
import type { ViewRecord } from "@/entities/view/model/types";

type GridState = {
  columnState: ColumnState[];
  sortModel: SortModelItem[];
  filterModel: Record<string, unknown> | null;
};

type Props<T> = {
  gridKey: string;
  rowData: T[];
  columnDefs: ColDef<T>[];
};

function buildDefaultState<T>(columnDefs: ColDef<T>[]): GridState {
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

export default function AGGridTable<T>({
  gridKey,
  rowData,
  columnDefs,
}: Props<T>) {
  const supabase = createClient();
  const gridRef = useRef<AgGridReact<T>>(null);
  const [views, setViews] = useState<ViewRecord[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loadingViews, setLoadingViews] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultState = useMemo(
    () => buildDefaultState(columnDefs),
    [columnDefs]
  );

  const [lastSavedState, setLastSavedState] =
    useState<GridState>(defaultState);

  const captureState = useCallback((): GridState => {
    const api = gridRef.current?.api;
    if (!api) {
      return defaultState;
    }

    return {
      columnState: api.getColumnState(),
      sortModel: api.getSortModel(),
      filterModel: api.getFilterModel(),
    };
  }, [defaultState]);

  const applyState = useCallback((state: GridState) => {
    const api = gridRef.current?.api;
    if (!api) {
      return;
    }
    api.applyColumnState({ state: state.columnState, applyOrder: true });
    api.setSortModel(state.sortModel);
    api.setFilterModel(state.filterModel);
  }, []);

  const refreshDirty = useCallback(() => {
    const current = captureState();
    const isDirty =
      JSON.stringify(current) !== JSON.stringify(lastSavedState);
    setDirty(isDirty);
  }, [captureState, lastSavedState]);

  useEffect(() => {
    let cancelled = false;

    const loadViews = async () => {
      setLoadingViews(true);
      const { data, error } = await supabase
        .from("views")
        .select("*")
        .eq("grid_key", gridKey)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        if (error) {
          setViews([]);
        } else {
          setViews((data ?? []) as ViewRecord[]);
        }
        setLoadingViews(false);
      }
    };

    loadViews();
    return () => {
      cancelled = true;
    };
  }, [gridKey, supabase]);

  const onGridReady = (event: GridReadyEvent) => {
    event.api.sizeColumnsToFit();
    setLastSavedState(defaultState);
    setDirty(false);
  };

  const onSelectView = (value: string) => {
    if (value === "default") {
      setActiveViewId(null);
      applyState(defaultState);
      setLastSavedState(defaultState);
      setDirty(false);
      return;
    }

    const selected = views.find((view) => view.id === value);
    if (!selected) {
      return;
    }

    const viewState: GridState = {
      columnState: (selected.column_state as ColumnState[]) ?? [],
      sortModel: (selected.sort_model as SortModelItem[]) ?? [],
      filterModel: (selected.filter_model as Record<string, unknown>) ?? null,
    };
    setActiveViewId(selected.id);
    applyState(viewState);
    setLastSavedState(viewState);
    setDirty(false);
  };

  const saveView = async (mode: "update" | "create") => {
    const current = captureState();

    if (mode === "update" && !activeViewId) {
      mode = "create";
    }

    let viewName = "";
    if (mode === "create") {
      viewName = window.prompt("View name")?.trim() ?? "";
      if (!viewName) {
        return;
      }
    }

    setSaving(true);
    if (mode === "create") {
      const { data, error } = await supabase
        .from("views")
        .insert({
          name: viewName,
          grid_key: gridKey,
          column_state: current.columnState,
          sort_model: current.sortModel,
          filter_model: current.filterModel,
        })
        .select("*")
        .single();

      if (!error && data) {
        setViews((prev) => [...prev, data as ViewRecord]);
        setActiveViewId(data.id);
        setLastSavedState(current);
        setDirty(false);
      }
    } else {
      const { error } = await supabase
        .from("views")
        .update({
          column_state: current.columnState,
          sort_model: current.sortModel,
          filter_model: current.filterModel,
        })
        .eq("id", activeViewId);

      if (!error) {
        setLastSavedState(current);
        setDirty(false);
      }
    }
    setSaving(false);
  };

  const deleteView = async () => {
    if (!activeViewId) {
      return;
    }
    const ok = window.confirm("Delete this view?");
    if (!ok) {
      return;
    }
    const { error } = await supabase
      .from("views")
      .delete()
      .eq("id", activeViewId);

    if (!error) {
      setViews((prev) => prev.filter((view) => view.id !== activeViewId));
      setActiveViewId(null);
      applyState(defaultState);
      setLastSavedState(defaultState);
      setDirty(false);
    }
  };

  return (
    <div className="panel">
      <div className="toolbar">
        <select
          value={activeViewId ?? "default"}
          onChange={(event) => onSelectView(event.target.value)}
          disabled={loadingViews}
        >
          <option value="default">Default View</option>
          {views.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="primary"
          onClick={() => saveView("update")}
          disabled={saving}
        >
          Save View
        </button>
        <button type="button" onClick={() => saveView("create")} disabled={saving}>
          Save As New View
        </button>
        <button type="button" onClick={deleteView} disabled={!activeViewId}>
          Delete View
        </button>
        <button
          type="button"
          onClick={() => onSelectView("default")}
          disabled={saving}
        >
          Reset to Default
        </button>
        {dirty ? <span className="tag">Unsaved changes</span> : null}
      </div>
      <div className="ag-theme-quartz grid-wrap">
        <AgGridReact<T>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
          onGridReady={onGridReady}
          onColumnMoved={refreshDirty}
          onColumnVisible={refreshDirty}
          onColumnResized={refreshDirty}
          onColumnPinned={refreshDirty}
          onSortChanged={refreshDirty}
          onFilterChanged={refreshDirty}
          suppressRowClickSelection
          rowSelection="multiple"
        />
      </div>
    </div>
  );
}
