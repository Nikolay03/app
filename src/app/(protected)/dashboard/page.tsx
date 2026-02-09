import Link from "next/link";
import { createClient } from "@/shared/lib/supabase/server";
import DashboardViewSelector from "@/features/views/ui/DashboardViewSelector";
import type { ViewRecord } from "@/entities/view/model/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("views").select("*");
  const views = (data ?? []) as ViewRecord[];
  const invoiceViews = views.filter((view) => view.grid_key === "invoices");
  const orderViews = views.filter((view) => view.grid_key === "orders");

  return (
    <div className="rounded-xl border border-layer-line bg-layer p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground-1">
        Manage your AG-Grid views for invoices and orders.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-primary">
        <Link href="/invoices">Go to Invoices</Link>
        <Link href="/orders">Go to Orders</Link>
      </div>
      <div className="mt-4">
        <DashboardViewSelector
          invoiceViews={invoiceViews}
          orderViews={orderViews}
        />
      </div>
    </div>
  );
}
