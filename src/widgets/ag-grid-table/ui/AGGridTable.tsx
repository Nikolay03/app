"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
} from "ag-grid-community";
import type { ViewRecord } from "@/entities/view/model/types";
import { useGridState } from "@/widgets/ag-grid-table/model/useGridState";
import { useViews } from "@/widgets/ag-grid-table/model/useViews";
import GridSkeleton from "@/widgets/ag-grid-table/ui/GridSkeleton";
import ViewToolbar from "@/widgets/ag-grid-table/ui/ViewToolbar";
import ViewToolbarSkeleton from "@/widgets/ag-grid-table/ui/ViewToolbarSkeleton";
import ColumnsMenu from "@/widgets/ag-grid-table/ui/ColumnsMenu";

ModuleRegistry.registerModules([AllCommunityModule]);

type Props<T> = {
  gridKey: string;
  rowData: T[];
  columnDefs: ColDef<T>[];
  initialViewId?: string | null;
  initialViews?: ViewRecord[];
};

export default function AGGridTable<T>({
  gridKey,
  rowData,
  columnDefs,
  initialViewId = null,
  initialViews,
}: Props<T>) {
  // AG Grid will re-apply `columnDefs` when the prop identity changes.
  // In dev/HMR this can happen unexpectedly and will reset column visibility,
  // fighting our persisted view state and the Columns menu.
  // This table treats `columnDefs` as static: first render wins.
  const [effectiveColumnDefs] = useState(() => columnDefs);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      columnDefs !== effectiveColumnDefs
    ) {
      console.warn(
        "AGGridTable: `columnDefs` prop changed after mount; ignoring to preserve grid state."
      );
    }
  }, [columnDefs, effectiveColumnDefs]);

  const gridRef = useRef<AgGridReact<T>>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [gridReady, setGridReady] = useState(false);
  const [initializingView, setInitializingView] = useState(
    Boolean(initialViewId)
  );
  const initialAppliedRef = useRef(false);

  const {
    defaultState,
    dirty,
    captureState,
    applyState,
    refreshDirty,
    markSaved,
    markDefault,
  } = useGridState<T>({ columnDefs: effectiveColumnDefs, gridRef });

  const {
    views,
    activeViewId,
    loadingViews,
    saving,
    selectView,
    resetToDefault,
    saveView,
    deleteView,
  } = useViews({
    gridKey,
    defaultState,
    captureState,
    applyState,
    onStateApplied: markSaved,
    initialViews,
  });

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      if (initialAppliedRef.current) {
        return;
      }

      setGridApi(event.api);

      // Establish the baseline "Default View" from the real grid state. This includes
      // any auto columns (e.g. row selection) and normalized widths.
      event.api.sizeColumnsToFit();
      const baseline = captureState();
      markDefault(baseline);

      if (initialViewId) {
        // Apply the initial view immediately before unblocking the UI to avoid
        // showing the default grid state first.
        const applied = selectView(initialViewId);
        if (!applied) {
          markSaved(baseline);
        }
      } else {
        // Save the actual initial state (includes width changes from sizeColumnsToFit).
        markSaved(baseline);
      }

      initialAppliedRef.current = true;
      setGridReady(true);
      setInitializingView(false);
    },
    [captureState, initialViewId, markDefault, markSaved, selectView]
  );

  return (
    <div className="relative isolate rounded-xl border border-layer-line bg-layer p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {loadingViews || initializingView ? (
          <ViewToolbarSkeleton />
        ) : (
          <ViewToolbar
            views={views}
            activeViewId={activeViewId}
            saving={saving}
            dirty={dirty}
            disabled={!gridReady}
            onSelectView={selectView}
            onSaveView={saveView}
            onDeleteView={deleteView}
            onResetDefault={resetToDefault}
          />
        )}
        <ColumnsMenu
          columnDefs={effectiveColumnDefs}
          api={gridApi}
          // Allow the menu to work as soon as the Grid API exists.
          // We only disable while applying the initial view.
          disabled={initializingView}
          onChanged={refreshDirty}
        />
      </div>
      <div className="relative mt-4 h-[600px]">
        {!gridReady || initializingView ? <GridSkeleton /> : null}
        <div className="h-full">
          <AgGridReact<T>
            ref={gridRef}
            rowData={rowData}
            columnDefs={effectiveColumnDefs}
            theme={themeQuartz}
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
            rowSelection={{
              mode: "multiRow",
              enableClickSelection: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}

