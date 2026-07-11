"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import type { Category } from "@/types";

export function useCategories() {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("user_id", { ascending: true }) // null (system) first, then user's
        .order("name");

      if (error) throw error;
      return data as Category[];
    },
    enabled: !authLoading && !!user,
  });
}

export function useCreateCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, icon }: { name: string; icon: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("categories")
        .insert({ name, icon, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, icon }: { id: number; name: string; icon: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("categories")
        .update({ name, icon })
        .eq("id", id)
        .eq("user_id", user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Check if category is used in transactions (user-scoped)
      const { count: transCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id)
        .eq("user_id", user!.id);

      if (transCount && transCount > 0) {
        throw new Error("Cannot delete: category has existing transactions");
      }

      // Check if category is used in recurring templates (user-scoped)
      const { count: recurCount } = await supabase
        .from("recurring_templates")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id)
        .eq("user_id", user!.id);

      if (recurCount && recurCount > 0) {
        throw new Error("Cannot delete: category has recurring templates");
      }

      // Check if category is used in budgets (user-scoped)
      const { count: budgetCount } = await supabase
        .from("budgets")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id)
        .eq("user_id", user!.id);

      if (budgetCount && budgetCount > 0) {
        throw new Error("Cannot delete: category has budgets");
      }

      // Safe to delete
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
