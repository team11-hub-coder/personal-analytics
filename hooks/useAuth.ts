"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function useLogin() {
  const router = useRouter();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });
}

export function useUser() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(["user"], session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });
}
