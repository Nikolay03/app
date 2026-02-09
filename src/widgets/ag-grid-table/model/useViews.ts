"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnState, SortModelItem } from "ag-grid-community";
import type { ViewRecord } from "@/entities/view/model/types";
import { useViewsData } from "@/entities/view/api/react-query";
import type { GridState } from "./types";
import { mergeSortIntoColumnState } from "./mergeSortIntoColumnState";

type Params = {
  gridKey: string;
  defaultState: GridState;
  captureState: () => GridState;
  applyState: (state: GridState) => void;
  onStateApplied: (state: GridState) => void;
  initialViews?: ViewRecord[];
};

type SaveMode = "update" | "create";

export function useViews({
  gridKey,
  defaultState,
  captureState,
  applyState,
  onStateApplied,
  initialViews,
}: Params) {
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  const { viewsQuery, insertMutation, updateMutation, deleteMutation } =
    useViewsData(gridKey, initialViews);

  const views = useMemo(() => viewsQuery.data ?? [], [viewsQuery.data]);

  const resetToDefault = useCallback(() => {
    setActiveViewId(null);
    applyState(defaultState);
    // Persist the actual grid state (AG Grid may normalize state on apply).
    onStateApplied(captureState());
  }, [applyState, captureState, defaultState, onStateApplied]);

  const selectView = useCallback(
    (value: string) => {
      if (value === "default") {
        resetToDefault();
        return true;
      }

      const selected = views.find((view) => view.id === value);
      if (!selected) {
        return false;
      }

      const viewState: GridState = {
        columnState: mergeSortIntoColumnState(
          (selected.column_state as ColumnState[]) ?? [],
          (selected.sort_model as SortModelItem[]) ?? []
        ),
        sortModel: (selected.sort_model as SortModelItem[]) ?? [],
        filterModel: (selected.filter_model as Record<string, unknown>) ?? null,
      };
      setActiveViewId(selected.id);
      applyState(viewState);
      // Persist the actual grid state (AG Grid may normalize state on apply).
      onStateApplied(captureState());
      return true;
    },
    [applyState, captureState, onStateApplied, resetToDefault, views]
  );

  const saveView = useCallback(
    async (mode: SaveMode, name?: string) => {
      const current = captureState();

      if (mode === "update" && !activeViewId) {
        mode = "create";
      }

      if (mode === "create") {
        const viewName = name?.trim() ?? "";
        if (!viewName) return;
      }

      const columnState = mergeSortIntoColumnState(
        current.columnState,
        current.sortModel
      );

      if (mode === "create") {
        const viewName = name!.trim();
        const created = await insertMutation.mutateAsync([
          {
            name: viewName,
            grid_key: gridKey,
            column_state: columnState,
            sort_model: current.sortModel,
            filter_model: current.filterModel,
          },
        ]);
        const first = created?.[0] as ViewRecord | undefined;
        if (first?.id) {
          setActiveViewId(first.id);
        }
        // Keep the dropdown in sync even if cache helpers don't auto-revalidate this query.
        await viewsQuery.refetch();
        onStateApplied(current);
      } else {
        await updateMutation.mutateAsync({
          id: activeViewId!,
          column_state: columnState,
          sort_model: current.sortModel,
          filter_model: current.filterModel,
        });
        await viewsQuery.refetch();
        onStateApplied(current);
      }
    },
    [
      activeViewId,
      captureState,
      gridKey,
      insertMutation,
      onStateApplied,
      updateMutation,
      viewsQuery,
    ]
  );

  const deleteView = useCallback(async () => {
    if (!activeViewId) return;

    await deleteMutation.mutateAsync({ id: activeViewId });
    await viewsQuery.refetch();
    resetToDefault();
  }, [activeViewId, deleteMutation, resetToDefault, viewsQuery]);

  return {
    views,
    activeViewId,
    // isFetching can be true during background refetch; avoid showing "loading"
    // UI and delaying initial view apply in that case.
    loadingViews: viewsQuery.isLoading,
    saving:
      insertMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    selectView,
    resetToDefault,
    saveView,
    deleteView,
  };
}
