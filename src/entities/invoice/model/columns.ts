import type { ColDef } from "ag-grid-community";
import type { Invoice } from "./types";

export const invoiceColumnDefs: ColDef<Invoice>[] = [
  { field: "invoice_id", headerName: "Invoice ID" },
  { field: "customer_name", headerName: "Customer Name" },
  { field: "customer_email", headerName: "Customer Email", hide: true },
  { field: "invoice_date", headerName: "Invoice Date" },
  { field: "due_date", headerName: "Due Date" },
  {
    field: "amount",
    headerName: "Amount",
    hide: true,
    valueFormatter: ({ value }) =>
      value == null ? "" : `$${Number(value).toFixed(2)}`,
  },
  {
    field: "tax",
    headerName: "Tax",
    hide: true,
    valueFormatter: ({ value }) =>
      value == null ? "" : `${Number(value).toFixed(2)}%`,
  },
  {
    field: "total",
    headerName: "Total",
    valueGetter: (params) => {
      if (params.data?.total != null) {
        return params.data.total;
      }
      const amount = Number(params.data?.amount ?? 0);
      const tax = Number(params.data?.tax ?? 0);
      return amount + amount * (tax / 100);
    },
    valueFormatter: ({ value }) =>
      value == null ? "" : `$${Number(value).toFixed(2)}`,
  },
  { field: "status", headerName: "Status" },
  { field: "payment_method", headerName: "Payment Method", hide: true },
  { field: "notes", headerName: "Notes", hide: true },
];
