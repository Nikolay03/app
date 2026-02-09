"use client";

import AGGridTable from "@/widgets/ag-grid-table/ui/AGGridTable";
import { orderColumnDefs } from "@/entities/order/model/columns";
import type { Order } from "@/entities/order/model/types";
import type { ViewRecord } from "@/entities/view/model/types";

type Props = {
  rows: Order[];
  initialViewId?: string | null;
  initialViews?: ViewRecord[];
};

export default function OrdersGrid({
  rows,
  initialViewId = null,
  initialViews,
}: Props) {
  return (
    <AGGridTable<Order>
      gridKey="orders"
      rowData={rows}
      columnDefs={orderColumnDefs}
      initialViewId={initialViewId}
      initialViews={initialViews}
    />
  );
}
