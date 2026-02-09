import AGGridTable from "@/widgets/ag-grid-table/ui/AGGridTable";
import { orderColumnDefs } from "@/entities/order/model/columns";
import { createClient } from "@/shared/lib/supabase/server";
import type { Order } from "@/entities/order/model/types";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("*");

  const rows = (data ?? []) as Order[];

  return (
    <div>
      <h1>Orders</h1>
      {error ? <p className="muted">{error.message}</p> : null}
      <AGGridTable<Order>
        gridKey="orders"
        rowData={rows}
        columnDefs={orderColumnDefs}
      />
    </div>
  );
}
