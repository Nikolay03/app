"use client";

import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";
import Input from "@/shared/ui/form/Input";
import Button from "@/shared/ui/button/Button";
import { useZodForm } from "@/shared/lib/react-hook-form";
import { AuthSchema, type AuthValues } from "@/features/auth/model/authSchema";
import {
  useSignInMutation,
  useSignUpMutation,
} from "@/features/auth/model/useAuthMutations";

export default function AuthForm() {
  const router = useRouter();
  const signInMutation = useSignInMutation();
  const signUpMutation = useSignUpMutation();
  const loading = signInMutation.isPending || signUpMutation.isPending;

  const form = useZodForm({
    schema: AuthSchema,
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  const onSignUp = (values: AuthValues) => {
    signInMutation.reset();
    signUpMutation.reset();
    signUpMutation.mutate({
      ...values,
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    });
  };

  const onSignIn = (values: AuthValues) => {
    signUpMutation.reset();
    signInMutation.reset();
    signInMutation.mutate(values, {
      onSuccess: () => {
        router.push("/dashboard");
        router.refresh();
      },
    });
  };

  const message =
    signInMutation.error?.message ??
    signUpMutation.error?.message ??
    (signUpMutation.isSuccess
      ? "Check your email to confirm your account."
      : null);

  return (
    <div className="mx-auto mt-20 w-full max-w-md rounded-xl border border-layer-line bg-layer p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Login</h2>
      <p className="text-sm text-muted-foreground-1">
        Use email + password to sign in or create account.
      </p>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSignIn)} className="mt-4 space-y-3">
          <Input name="email" type="email" placeholder="Email" label="Email" />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            label="Password"
          />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              Sign In
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit(onSignUp)}
              disabled={loading}
            >
              Sign Up
            </Button>
          </div>
        </form>
      </FormProvider>
      {message ? (
        <p className="mt-3 text-sm text-muted-foreground-1">{message}</p>
      ) : null}
    </div>
  );
}
