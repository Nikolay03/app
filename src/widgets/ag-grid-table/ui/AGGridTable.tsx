"use client";

import { useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
  type IServerSideDatasource,
  type RefreshServerSideParams,
} from "ag-grid-community";
import { AllEnterpriseModule, LicenseManager } from "ag-grid-enterprise";
import type { ViewRecord } from "@/entities/view/model/types";
import { useGridState } from "@/widgets/ag-grid-table/model/useGridState";
import { useViews } from "@/widgets/ag-grid-table/model/useViews";
import { createNextServerSideDatasource } from "@/widgets/ag-grid-table/model/nextServerSideDatasource";
import GridSkeleton from "@/widgets/ag-grid-table/ui/GridSkeleton";
import ViewToolbar from "@/widgets/ag-grid-table/ui/ViewToolbar";
import ViewToolbarSkeleton from "@/widgets/ag-grid-table/ui/ViewToolbarSkeleton";
import ColumnsMenu from "@/widgets/ag-grid-table/ui/ColumnsMenu";

ModuleRegistry.registerModules([AllEnterpriseModule]);

const licenseKey = process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY;
if (typeof licenseKey === "string" && licenseKey.trim()) {
  LicenseManager.setLicenseKey(licenseKey.trim());
}

type BaseProps<T> = {
  gridKey: string;
  columnDefs: ColDef<T>[];
  initialViewId?: string | null;
  initialViews?: ViewRecord[];
};

type Props<T> =
  | (BaseProps<T> & {
      mode?: "client";
      rowData: T[];
    })
  | (BaseProps<T> & {
      mode: "ssrm-enterprise";
      table: "invoices" | "orders";
    });

export default function AGGridTable<T>({
  gridKey,
  columnDefs,
  initialViewId = null,
  initialViews,
  ...rest
}: Props<T>) {
  const mode = rest.mode ?? "client";
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

  const refreshRows = () => {
    if (mode !== "ssrm-enterprise") return;
    const api = gridRef.current?.api;
    if (!api) return;
    const params: RefreshServerSideParams = { purge: true };
    api.refreshServerSide(params);
  };

  const {
    defaultState,
    dirty,
    captureState,
    applyState: applyStateRaw,
    refreshDirty,
    markSaved,
    markDefault,
  } = useGridState<T>({ columnDefs: effectiveColumnDefs, gridRef });

  const applyState = (state: Parameters<typeof applyStateRaw>[0]) => {
    applyStateRaw(state);
    refreshRows();
  };

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

  const serverSideDatasource: IServerSideDatasource<unknown> | null =
    mode === "ssrm-enterprise"
      ? createNextServerSideDatasource({
          table: (rest as { table: "invoices" | "orders" }).table,
        })
      : null;

  const onGridReady = (event: GridReadyEvent) => {
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

    refreshRows();
  };

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
            rowData={mode === "client" ? (rest as { rowData: T[] }).rowData : undefined}
            rowModelType={mode === "ssrm-enterprise" ? "serverSide" : undefined}
            serverSideDatasource={
              mode === "ssrm-enterprise" ? serverSideDatasource ?? undefined : undefined
            }
            cacheBlockSize={mode === "ssrm-enterprise" ? 100 : undefined}
            // Force SSRM sorting to be server-driven, even when all rows are loaded.
            serverSideEnableClientSideSort={
              mode === "ssrm-enterprise" ? false : undefined
            }
            serverSideSortAllLevels={mode === "ssrm-enterprise" ? true : undefined}
            columnDefs={effectiveColumnDefs}
            theme={themeQuartz}
            defaultColDef={{
              sortable: true,
              // With Enterprise registered, `filter: true` may default to Set Filter for strings.
              // Force the classic "Contains" UI and keep filtering server-driven via SSRM.
              filter: "agTextColumnFilter",
              resizable: true,
              // Keep the old UI: no column menu (three-dots) in headers.
              suppressHeaderMenuButton: true,
              suppressHeaderContextMenu: true,
            }}
            onGridReady={onGridReady}
            onColumnMoved={refreshDirty}
            onColumnVisible={refreshDirty}
            onColumnResized={refreshDirty}
            onColumnPinned={refreshDirty}
            onSortChanged={() => {
              refreshDirty();
              refreshRows();
            }}
            onFilterChanged={() => {
              refreshDirty();
              refreshRows();
            }}
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

