import type { ColDef } from "ag-grid-community";
import type { Order } from "./types";

export const orderColumnDefs: ColDef<Order>[] = [
  { field: "order_id", headerName: "Order ID" },
  { field: "customer_name", headerName: "Customer Name" },
  { field: "customer_phone", headerName: "Customer Phone", initialHide: true },
  { field: "order_date", headerName: "Order Date" },
  {
    field: "shipping_address",
    headerName: "Shipping Address",
    initialHide: true,
  },
  { field: "items_count", headerName: "Items Count" },
  {
    field: "subtotal",
    headerName: "Subtotal",
    initialHide: true,
    valueFormatter: ({ value }) =>
      value == null ? "" : `$${Number(value).toFixed(2)}`,
  },
  {
    field: "shipping_cost",
    headerName: "Shipping Cost",
    initialHide: true,
    valueFormatter: ({ value }) =>
      value == null ? "" : `$${Number(value).toFixed(2)}`,
  },
  {
    field: "discount",
    headerName: "Discount",
    initialHide: true,
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
      const subtotal = Number(params.data?.subtotal ?? 0);
      const shipping = Number(params.data?.shipping_cost ?? 0);
      const discount = Number(params.data?.discount ?? 0);
      return subtotal + shipping - subtotal * (discount / 100);
    },
    valueFormatter: ({ value }) =>
      value == null ? "" : `$${Number(value).toFixed(2)}`,
  },
  { field: "status", headerName: "Status" },
  { field: "tracking_number", headerName: "Tracking Number" },
  {
    field: "estimated_delivery",
    headerName: "Estimated Delivery",
    initialHide: true,
  },
];
