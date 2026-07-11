"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { Transaction } from "@/types";

// Transaction with joined category info
export interface TransactionWithCategory extends Transaction {
  categories: { id: number; name: string; icon: string } | null;
}

interface TransactionFilters {
  month?: string; // 'YYYY-MM'
  category_id?: number;
}

export function useTransactions(filters?: TransactionFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*, categories(id, name, icon)")
        .order("date", { ascending: false });

      // Filter by month
      if (filters?.month) {
        const [year, month] = filters.month.split("-");
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(
          parseInt(year),
          parseInt(month),
          0
        ).getDate();
        const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

        query = query.gte("date", startDate).lte("date", endDate);
      }

      // Filter by category
      if (filters?.category_id) {
        query = query.eq("category_id", filters.category_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TransactionWithCategory[];
    },
  });
}

export function useCreateTransaction() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: {
      amount: number;
      category_id: number;
      description?: string;
      date: string;
      receipt_image_url?: string;
      entry_source?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user!.id,
          amount: transaction.amount,
          category_id: transaction.category_id,
          description: transaction.description,
          date: transaction.date,
          receipt_image_url: transaction.receipt_image_url,
          entry_source: transaction.entry_source || "manual_form",
        })
        .select("*, categories(id, name, icon)")
        .single();

      if (error) throw error;
      return data as TransactionWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateTransaction() {
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
      date?: string;
    }) => {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select("*, categories(id, name, icon)")
        .single();

      if (error) throw error;
      return data as TransactionWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
