"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/browser";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button type="button" onClick={onLogout}>
      Logout
    </button>
  );
}
