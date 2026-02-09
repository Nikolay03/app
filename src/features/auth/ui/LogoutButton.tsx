"use client";

import { useRouter } from "next/navigation";
import Button from "@/shared/ui/button/Button";
import { useSignOutMutation } from "@/features/auth/model/useAuthMutations";

export default function LogoutButton() {
  const router = useRouter();
  const signOutMutation = useSignOutMutation();

  const onLogout = () => {
    signOutMutation.reset();
    signOutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
        router.refresh();
      },
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onLogout}
      disabled={signOutMutation.isPending}
    >
      Logout
    </Button>
  );
}
