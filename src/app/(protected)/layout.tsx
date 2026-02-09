import Link from "next/link";
import { createClient } from "@/shared/lib/supabase/server";
import LogoutButton from "@/features/auth/ui/LogoutButton";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="app-shell">
      <header className="app-header">
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/invoices">Invoices</Link>
          <Link href="/orders">Orders</Link>
        </nav>
        <div className="toolbar">
          <span className="muted">{user?.email ?? "Unknown user"}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}
