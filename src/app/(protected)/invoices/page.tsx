import AGGridTable from "@/widgets/ag-grid-table/ui/AGGridTable";
import { invoiceColumnDefs } from "@/entities/invoice/model/columns";
import { createClient } from "@/shared/lib/supabase/server";
import type { Invoice } from "@/entities/invoice/model/types";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("invoices").select("*");

  const rows = (data ?? []) as Invoice[];

  return (
    <div>
      <h1>Invoices</h1>
      {error ? <p className="muted">{error.message}</p> : null}
      <AGGridTable<Invoice>
        gridKey="invoices"
        rowData={rows}
        columnDefs={invoiceColumnDefs}
      />
    </div>
  );
}
