"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ViewRecord } from "@/entities/view/model/types";
import Select from "@/shared/ui/form/Select";

type Props = {
  invoiceViews: ViewRecord[];
  orderViews: ViewRecord[];
};

export default function DashboardViewSelector({
  invoiceViews,
  orderViews,
}: Props) {
  const router = useRouter();
  const invoiceOptions = useMemo(() => invoiceViews, [invoiceViews]);
  const orderOptions = useMemo(() => orderViews, [orderViews]);

  return (
    <div className="rounded-xl border border-layer-line bg-layer p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Quick View Selector</h2>
      <p className="text-sm text-muted-foreground-1">
        Jump directly to a saved view.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Select
          label="Invoices"
          defaultValue=""
          onChange={(event) => {
            const id = event.target.value;
            if (id) {
              router.push(`/invoices?view=${id}`);
            }
          }}
        >
          <option value="">Select view</option>
          {invoiceOptions.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </Select>
        <Select
          label="Orders"
          defaultValue=""
          onChange={(event) => {
            const id = event.target.value;
            if (id) {
              router.push(`/orders?view=${id}`);
            }
          }}
        >
          <option value="">Select view</option>
          {orderOptions.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
