"use client";

import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/shared/lib/supabase/browser";
import type { AuthValues } from "@/features/auth/model/authSchema";

export type SignUpInput = AuthValues & { emailRedirectTo: string };

export function useSignInMutation() {
  const supabase = useMemo(() => createClient(), []);

  return useMutation({
    mutationFn: async (values: AuthValues) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      return null;
    },
  });
}

export function useSignUpMutation() {
  const supabase = useMemo(() => createClient(), []);

  return useMutation({
    mutationFn: async (values: SignUpInput) => {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: values.emailRedirectTo,
        },
      });
      if (error) throw error;
      return null;
    },
  });
}

export function useSignOutMutation() {
  const supabase = useMemo(() => createClient(), []);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return null;
    },
  });
}

