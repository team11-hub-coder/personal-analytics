"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import type { Budget } from "@/types";

// Budget with joined category info
export interface BudgetWithCategory extends Budget {
  categories: { id: number; name: string; icon: string } | null;
}

export function useBudgets() {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["budgets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, categories(id, name, icon)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BudgetWithCategory[];
    },
    enabled: !authLoading && !!user,
  });
}

export function useCreateBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      category_id,
      monthly_limit,
    }: {
      category_id: number;
      monthly_limit: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("budgets")
        .insert({
          user_id: user!.id,
          category_id,
          monthly_limit,
        })
        .select("*, categories(id, name, icon)")
        .single();

      if (error) throw error;
      return data as BudgetWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useUpdateBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      monthly_limit,
    }: {
      id: number;
      monthly_limit: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("budgets")
        .update({ monthly_limit })
        .eq("id", id)
        .eq("user_id", user!.id)
        .select("*, categories(id, name, icon)")
        .single();

      if (error) throw error;
      return data as BudgetWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useDeleteBudget() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
