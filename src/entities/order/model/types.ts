export type Order = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  order_date: string;
  shipping_address: string;
  items_count: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "delivered";
  tracking_number: string | null;
  estimated_delivery: string | null;
};
