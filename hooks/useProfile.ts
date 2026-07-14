"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import { detectTimezone, getCurrencyFromTimezone } from "@/lib/currency";
import type { Profile } from "@/types";

// Helper to get authenticated user or throw
async function getAuthenticatedUser(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export function useProfile() {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      // Try to get existing profile
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

      // If profile doesn't exist, create it
      if (profileErr && profileErr.code === "PGRST116") {
        const detectedTz = detectTimezone();
        const detectedCurrency = getCurrencyFromTimezone(detectedTz);
        const { data: newProfile, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id: user!.id,
            display_name: user!.email?.split("@")[0] || "User",
            currency: detectedCurrency,
            timezone: detectedTz,
          })
          .select()
          .single();

        if (createErr) throw createErr;
        return {
          ...newProfile,
          email: user!.email,
        } as Profile & { email: string };
      }

      if (profileErr) throw profileErr;

      return {
        ...profile,
        email: user!.email,
      } as Profile & { email: string };
    },
    enabled: !authLoading && !!user,
  });
}

export function useUpdateProfile() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      display_name?: string;
      daily_calorie_target?: number;
      monthly_budget_goal?: number;
      currency?: string;
      timezone?: string;
    }) => {
      const user = await getAuthenticatedUser(supabase);

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
