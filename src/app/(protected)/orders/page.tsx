import OrdersGrid from "./components/OrdersGrid";
import { createClient } from "@/shared/lib/supabase/server";
import PageHeader from "@/shared/ui/page/PageHeader";
import type { ViewRecord } from "@/entities/view/model/types";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const supabase = await createClient();
  const { data: viewsData, error: viewsError } = await supabase
    .from("views")
    .select("*")
    .eq("grid_key", "orders")
    .order("created_at", { ascending: true });

  const initialViews = (viewsData ?? []) as ViewRecord[];

  const resolvedParams = (await searchParams) ?? {};
  const initialViewId = resolvedParams.view ?? null;

  return (
    <div>
      <PageHeader title="Orders" errors={[viewsError]} />
      <OrdersGrid
        initialViewId={initialViewId}
        initialViews={initialViews}
      />
    </div>
  );
}
