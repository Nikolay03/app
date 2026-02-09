import type { ColDef } from "ag-grid-community";
import type { Invoice } from "./types";

export const invoiceColumnDefs: ColDef<Invoice>[] = [
  { field: "invoice_id", headerName: "Invoice ID", filter: "agTextColumnFilter" },
  { field: "customer_name", headerName: "Customer Name", filter: "agTextColumnFilter" },
  {
    field: "customer_email",
    headerName: "Customer Email",
    initialHide: true,
    filter: "agTextColumnFilter",
  },
  { field: "invoice_date", headerName: "Invoice Date", filter: "agDateColumnFilter" },
  { field: "due_date", headerName: "Due Date", filter: "agDateColumnFilter" },
  {
    field: "amount",
    headerName: "Amount",
    initialHide: true,
    filter: "agNumberColumnFilter",
    valueFormatter: ({ value }) =>
      value == null ? "" : `$${Number(value).toFixed(2)}`,
  },
  {
    field: "tax",
    headerName: "Tax",
    initialHide: true,
    filter: "agNumberColumnFilter",
    valueFormatter: ({ value }) =>
      value == null ? "" : `${Number(value).toFixed(2)}%`,
  },
  {
    field: "total",
    headerName: "Total",
    filter: "agNumberColumnFilter",
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
  { field: "status", headerName: "Status", filter: "agTextColumnFilter" },
  {
    field: "payment_method",
    headerName: "Payment Method",
    initialHide: true,
    filter: "agTextColumnFilter",
  },
  { field: "notes", headerName: "Notes", initialHide: true, filter: "agTextColumnFilter" },
];
