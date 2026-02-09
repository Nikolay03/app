import InvoicesGrid from "./components/InvoicesGrid";
import { createClient } from "@/shared/lib/supabase/server";
import PageHeader from "@/shared/ui/page/PageHeader";
import type { Invoice } from "@/entities/invoice/model/types";
import type { ViewRecord } from "@/entities/view/model/types";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("invoices").select("*");
  const { data: viewsData, error: viewsError } = await supabase
    .from("views")
    .select("*")
    .eq("grid_key", "invoices")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as Invoice[];
  const initialViews = (viewsData ?? []) as ViewRecord[];

  const resolvedParams = (await searchParams) ?? {};
  const initialViewId = resolvedParams.view ?? null;

  return (
    <div>
      <PageHeader title="Invoices" errors={[error, viewsError]} />
      <InvoicesGrid
        rows={rows}
        initialViewId={initialViewId}
        initialViews={initialViews}
      />
    </div>
  );
}
