"use client";

import type { ViewRecord } from "@/entities/view/model/types";
import Button from "@/shared/ui/button/Button";
import Select from "@/shared/ui/form/Select";

type Props = {
  views: ViewRecord[];
  activeViewId: string | null;
  saving: boolean;
  dirty: boolean;
  disabled?: boolean;
  onSelectView: (value: string) => void;
  onSaveView: (mode: "update" | "create", name?: string) => Promise<void>;
  onDeleteView: () => Promise<void>;
  onResetDefault: () => void;
};

export default function ViewToolbar({
  views,
  activeViewId,
  saving,
  dirty,
  disabled = false,
  onSelectView,
  onSaveView,
  onDeleteView,
  onResetDefault,
}: Props) {
  const isDisabled = saving || disabled;

  return (
    <>
      <Select
        className="w-56"
        value={activeViewId ?? "default"}
        onChange={(event) => onSelectView(event.target.value)}
        disabled={isDisabled}
      >
        <option value="default">Default View</option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name}
          </option>
        ))}
      </Select>
      <Button
        type="button"
        onClick={async () => {
          try {
            await onSaveView("update");
          } catch (err) {
            console.error(err);
            window.alert("Failed to save view");
          }
        }}
        disabled={isDisabled}
      >
        Save View
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          const viewName = window.prompt("View name")?.trim() ?? "";
          if (!viewName) return;
          try {
            await onSaveView("create", viewName);
          } catch (err) {
            console.error(err);
            window.alert("Failed to save view");
          }
        }}
        disabled={isDisabled}
      >
        Save As New View
      </Button>
      <Button
        type="button"
        variant="danger"
        onClick={async () => {
          if (!activeViewId) return;
          const ok = window.confirm("Delete this view?");
          if (!ok) return;
          try {
            await onDeleteView();
          } catch (err) {
            console.error(err);
            window.alert("Failed to delete view");
          }
        }}
        disabled={isDisabled || !activeViewId}
      >
        Delete View
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onResetDefault}
        disabled={isDisabled}
      >
        Reset to Default
      </Button>
      {dirty ? (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          Unsaved changes
        </span>
      ) : null}
    </>
  );
}
