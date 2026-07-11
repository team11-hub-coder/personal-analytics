"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import type { RecurringTemplate } from "@/types";

// Recurring template with joined category info
export interface RecurringTemplateWithCategory extends RecurringTemplate {
  categories: { id: number; name: string; icon: string } | null;
}

export function useRecurringTemplates() {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["recurring_templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_templates")
        .select("*, categories(id, name, icon)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RecurringTemplateWithCategory[];
    },
    enabled: !authLoading && !!user,
  });
}

export function useCreateRecurringTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: {
      amount: number;
      category_id: number;
      description?: string;
      interval: "weekly" | "monthly";
      next_run_date: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("recurring_templates")
        .insert({
          user_id: user!.id,
          amount: template.amount,
          category_id: template.category_id,
          description: template.description,
          interval: template.interval,
          next_run_date: template.next_run_date,
        })
        .select("*, categories(id, name, icon)")
        .single();

      if (error) throw error;
      return data as RecurringTemplateWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_templates"] });
    },
  });
}

export function useUpdateRecurringTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: number;
      amount?: number;
      category_id?: number;
      description?: string;
      interval?: "weekly" | "monthly";
      next_run_date?: string;
      is_active?: boolean;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("recurring_templates")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user!.id)
        .select("*, categories(id, name, icon)")
        .single();

      if (error) throw error;
      return data as RecurringTemplateWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_templates"] });
    },
  });
}

export function useDeleteRecurringTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("recurring_templates")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_templates"] });
    },
  });
}

// Process due templates - creates transactions from templates
export function useProcessRecurringTemplates() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get all active templates that are due
      const today = new Date().toISOString().split("T")[0];
      const { data: templates, error: fetchError } = await supabase
        .from("recurring_templates")
        .select("*, categories(id, name, icon)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .lte("next_run_date", today);

      if (fetchError) throw fetchError;
      if (!templates || templates.length === 0) return { created: 0 };

      let createdCount = 0;

      // Create transaction for each due template
      for (const template of templates) {
        // Create the transaction
        const { error: transError } = await supabase
          .from("transactions")
          .insert({
            user_id: user!.id,
            amount: template.amount,
            category_id: template.category_id,
            description: template.description,
            date: template.next_run_date,
            entry_source: "recurring",
            template_id: template.id,
          });

        if (transError) throw transError;

        // Calculate next run date
        const nextDate = new Date(template.next_run_date);
        if (template.interval === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // Update template's next_run_date
        const { error: updateError } = await supabase
          .from("recurring_templates")
          .update({ next_run_date: nextDate.toISOString().split("T")[0] })
          .eq("id", template.id);

        if (updateError) throw updateError;

        createdCount++;
      }

      // Invalidate both templates and transactions
      queryClient.invalidateQueries({ queryKey: ["recurring_templates"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      return { created: createdCount };
    },
  });
}
