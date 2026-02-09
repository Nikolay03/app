"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ColDef, GridApi } from "ag-grid-community";
import Button from "@/shared/ui/button/Button";
import cn from "@/shared/lib/cn";
import {
  readHiddenByColId,
  setColumnVisible,
  setColumnsVisible,
} from "@/widgets/ag-grid-table/model/columnVisibility";

type ColInfo = {
  colId: string;
  label: string;
};

function colDefToInfo<T>(def: ColDef<T>): ColInfo | null {
  const colId = def.field ?? def.colId ?? "";
  if (!colId) return null;
  const label =
    typeof def.headerName === "string" && def.headerName.trim()
      ? def.headerName.trim()
      : colId;
  return { colId, label };
}

export type ColumnsMenuProps<T> = {
  columnDefs: ColDef<T>[];
  api: GridApi | null;
  disabled?: boolean;
  onChanged?: () => void;
};

export default function ColumnsMenu<T>({
  columnDefs,
  api,
  disabled = false,
  onChanged,
}: ColumnsMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [hiddenByColId, setHiddenByColId] = useState<Record<string, boolean>>(
    {}
  );
  // We allow column toggles whenever the Grid API exists. While a view is being
  // applied (`disabled=true`), the grid may still update column state; we keep
  // UI synced via events.
  const canMutate = Boolean(api);
  const rafRef = useRef<number | null>(null);
  const hiddenRef = useRef<Record<string, boolean>>({});

  const columns = useMemo(() => {
    const mapped = columnDefs.map(colDefToInfo).filter(Boolean) as ColInfo[];
    // Keep stable order and avoid accidental duplicates.
    const seen = new Set<string>();
    return mapped.filter((c) => (seen.has(c.colId) ? false : (seen.add(c.colId), true)));
  }, [columnDefs]);

  const setHiddenIfChanged = (next: Record<string, boolean>) => {
    const prev = hiddenRef.current;
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    if (prevKeys.length === nextKeys.length) {
      let same = true;
      for (const k of nextKeys) {
        if (prev[k] !== next[k]) {
          same = false;
          break;
        }
      }
      if (same) return;
    }

    hiddenRef.current = next;
    setHiddenByColId(next);
  };

  const syncFromApi = () => {
    if (!api) return;
    const next = readHiddenByColId(api);
    setHiddenIfChanged(next);
  };

  const scheduleSyncFromApi = () => {
    if (!api) return;
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      syncFromApi();
    });
  };

  useEffect(() => {
    if (!open || !api) return;

    // Keep UI in sync with grid changes (e.g. when a saved view is applied).
    scheduleSyncFromApi();
    api.addEventListener("columnVisible", scheduleSyncFromApi);
    api.addEventListener("columnEverythingChanged", scheduleSyncFromApi);

    return () => {
      api.removeEventListener("columnVisible", scheduleSyncFromApi);
      api.removeEventListener("columnEverythingChanged", scheduleSyncFromApi);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return columns;
    return columns.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.colId.toLowerCase().includes(q)
    );
  }, [columns, query]);

  const visibleCount = useMemo(() => {
    return columns.filter((c) => !hiddenByColId[c.colId]).length;
  }, [columns, hiddenByColId]);

  const totalCount = columns.length;

  const setVisible = (colId: string, visible: boolean) => {
    if (!api || !canMutate) return;
    setLastError(null);
    const ok = setColumnVisible(api, colId, visible);
    if (!ok) {
      const known = api.getColumnState().map((s) => s.colId).filter(Boolean);
      console.warn("ColumnsMenu: failed to apply column visibility", {
        colId,
        visible,
        knownColIds: known,
      });
      setLastError(`Failed to toggle "${colId}" (column not found in grid state).`);
      return;
    }
    scheduleSyncFromApi();
    onChanged?.();
  };

  const setAllVisible = (visible: boolean) => {
    if (!api || !canMutate) return;
    setLastError(null);
    const ok = setColumnsVisible(
      api,
      columns.map((c) => c.colId),
      visible
    );
    if (!ok) {
      console.warn("ColumnsMenu: failed to apply show/hide all", {
        visible,
        colIds: columns.map((c) => c.colId),
      });
      setLastError("Failed to apply show/hide all.");
      return;
    }
    scheduleSyncFromApi();
    onChanged?.();
  };

  return (
    <div className="relative z-50">
      <Button
        type="button"
        variant="secondary"
        disabled={false}
        onClick={() => {
          if (!open) scheduleSyncFromApi();
          setOpen((v) => !v);
        }}
      >
        Columns
      </Button>

      {open ? (
        <div
          className="absolute right-0 top-full z-[1000] mt-2 w-[340px] rounded-xl border border-layer-line bg-layer p-3 shadow-lg"
          role="dialog"
          aria-label="Columns"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-foreground">Columns</div>
            <button
              type="button"
              className="text-xs font-semibold text-muted-foreground-1 hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="mt-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search columns..."
              className={cn(
                "py-2.5 sm:py-3 px-4 block w-full rounded-lg bg-layer border border-layer-line text-sm text-foreground placeholder:text-muted-foreground-1",
                "focus:border-primary-focus focus:ring-primary-focus"
              )}
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground-1">
              Visible: {visibleCount}/{totalCount}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "text-xs font-semibold",
                  canMutate ? "text-primary hover:underline" : "text-muted-foreground-1"
                )}
                onClick={() => setAllVisible(true)}
                disabled={!canMutate}
              >
                Show all
              </button>
              <button
                type="button"
                className={cn(
                  "text-xs font-semibold",
                  canMutate ? "text-primary hover:underline" : "text-muted-foreground-1"
                )}
                onClick={() => setAllVisible(false)}
                disabled={!canMutate}
              >
                Hide all
              </button>
            </div>
          </div>

          {!api ? (
            <div className="mt-2 text-xs text-muted-foreground-1">
              Grid is still initializing. Column toggles will become available in a moment.
            </div>
          ) : null}
          {api && disabled ? (
            <div className="mt-2 text-xs text-muted-foreground-1">
              A view is being applied. Column state may still update in the background.
            </div>
          ) : null}
          {lastError ? (
            <div className="mt-2 text-xs text-destructive">{lastError}</div>
          ) : null}

          <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-layer-line">
            <ul className="divide-y divide-layer-line">
              {filtered.map((c) => {
                const hidden = hiddenByColId[c.colId] ?? false;
                const checked = !hidden;
                return (
                  <li key={c.colId} className="flex items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-layer-line text-primary focus:ring-primary-focus"
                      checked={checked}
                      disabled={!canMutate}
                      onChange={(e) => setVisible(c.colId, e.target.checked)}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm text-foreground">{c.label}</div>
                      <div className="truncate text-xs text-muted-foreground-1">
                        {c.colId}
                      </div>
                    </div>
                  </li>
                );
              })}
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground-1">
                  No columns found
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
