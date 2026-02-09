"use client";

import AGGridTable from "@/widgets/ag-grid-table/ui/AGGridTable";
import { invoiceColumnDefs } from "@/entities/invoice/model/columns";
import type { Invoice } from "@/entities/invoice/model/types";
import type { ViewRecord } from "@/entities/view/model/types";

type Props = {
  initialViewId?: string | null;
  initialViews?: ViewRecord[];
};

export default function InvoicesGrid({
  initialViewId = null,
  initialViews,
}: Props) {
  return (
    <AGGridTable<Invoice>
      gridKey="invoices"
      mode="ssrm-enterprise"
      table="invoices"
      columnDefs={invoiceColumnDefs}
      initialViewId={initialViewId}
      initialViews={initialViews}
    />
  );
}
