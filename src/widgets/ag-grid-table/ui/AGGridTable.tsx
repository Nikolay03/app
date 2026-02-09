"use client";

import { useCallback, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridReadyEvent,
} from "ag-grid-community";
import type { ViewRecord } from "@/entities/view/model/types";
import { useGridState } from "@/widgets/ag-grid-table/model/useGridState";
import { useViews } from "@/widgets/ag-grid-table/model/useViews";
import GridSkeleton from "@/widgets/ag-grid-table/ui/GridSkeleton";
import ViewToolbar from "@/widgets/ag-grid-table/ui/ViewToolbar";
import ViewToolbarSkeleton from "@/widgets/ag-grid-table/ui/ViewToolbarSkeleton";

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
  const gridRef = useRef<AgGridReact<T>>(null);
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
  } = useGridState<T>({ columnDefs, gridRef });

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

      if (initialViewId) {
        // Apply the initial view immediately before unblocking the UI to avoid
        // showing the default grid state first.
        const applied = selectView(initialViewId);
        if (!applied) {
          markSaved(captureState());
        }
      } else {
        event.api.sizeColumnsToFit();
        // Save the actual initial state (includes width changes from sizeColumnsToFit).
        markSaved(captureState());
      }

      initialAppliedRef.current = true;
      setGridReady(true);
      setInitializingView(false);
    },
    [captureState, initialViewId, markSaved, selectView]
  );

  return (
    <div className="rounded-xl border border-layer-line bg-layer p-4 shadow-sm">
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
      </div>
      <div className="relative mt-4 h-[600px]">
        {!gridReady || initializingView ? <GridSkeleton /> : null}
        <div className="h-full">
          <AgGridReact<T>
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
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

