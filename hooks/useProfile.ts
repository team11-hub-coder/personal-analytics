"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { Profile } from "@/types";

export function useProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["profile"],
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
        const { data: newProfile, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id: user!.id,
            display_name: user!.email?.split("@")[0] || "User",
            currency: "MMK",
            timezone: "Asia/Yangon",
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
