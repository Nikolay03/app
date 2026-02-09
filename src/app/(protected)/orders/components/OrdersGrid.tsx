"use client";

import AGGridTable from "@/widgets/ag-grid-table/ui/AGGridTable";
import { orderColumnDefs } from "@/entities/order/model/columns";
import type { Order } from "@/entities/order/model/types";
import type { ViewRecord } from "@/entities/view/model/types";

type Props = {
  initialViewId?: string | null;
  initialViews?: ViewRecord[];
};

export default function OrdersGrid({
  initialViewId = null,
  initialViews,
}: Props) {
  return (
    <AGGridTable<Order>
      gridKey="orders"
      mode="ssrm-enterprise"
      table="orders"
      columnDefs={orderColumnDefs}
      initialViewId={initialViewId}
      initialViews={initialViews}
    />
  );
}
