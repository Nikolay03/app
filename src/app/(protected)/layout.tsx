import Link from "next/link";
import { createClient } from "@/shared/lib/supabase/server";
import LogoutButton from "@/features/auth/ui/LogoutButton";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <header className="bg-layer border-b border-layer-line px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-4 text-sm font-semibold text-foreground">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/invoices">Invoices</Link>
          <Link href="/orders">Orders</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground-1">
            {user?.email ?? "Unknown user"}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
