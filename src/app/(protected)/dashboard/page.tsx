import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="panel">
      <h1>Dashboard</h1>
      <p className="muted">
        Manage your AG-Grid views for invoices and orders.
      </p>
      <div className="toolbar" style={{ marginTop: 16 }}>
        <Link href="/invoices">Go to Invoices</Link>
        <Link href="/orders">Go to Orders</Link>
      </div>
    </div>
  );
}
