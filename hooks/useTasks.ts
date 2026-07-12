"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import type { Task, TaskWithCategory, TaskCategory, TaskView } from "@/types";

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

interface TaskFilters {
  status?: "pending" | "completed" | "overdue";
  priority?: "low" | "medium" | "high";
  category_id?: number;
}

// ─── Task Categories ─────────────────────────────────────────────

export function useTaskCategories() {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["task-categories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as TaskCategory[];
    },
    enabled: !authLoading && !!user,
  });
}

export function useCreateTaskCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: { name: string; color?: string }) => {
      const user = await getAuthenticatedUser(supabase);

      const { data, error } = await supabase
        .from("task_categories")
        .insert({
          user_id: user.id,
          name: category.name,
          color: category.color || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TaskCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-categories"] });
    },
  });
}

export function useDeleteTaskCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const user = await getAuthenticatedUser(supabase);

      const { error } = await supabase
        .from("task_categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-categories"] });
    },
  });
}

// ─── Tasks ───────────────────────────────────────────────────────

export function useTasks(filters?: TaskFilters) {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["tasks", filters, user?.id],
    queryFn: async () => {
      // Use the view which includes effective_status
      let query = supabase
        .from("tasks_view")
        .select("*, task_categories(id, name, color)")
        .order("created_at", { ascending: false });

      // Filter by effective status (from the view)
      if (filters?.status) {
        query = query.eq("effective_status", filters.status);
      }

      // Filter by priority
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }

      // Filter by category
      if (filters?.category_id) {
        query = query.eq("category_id", filters.category_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TaskWithCategory[];
    },
    enabled: !authLoading && !!user,
  });
}

export function useCreateTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      priority: "low" | "medium" | "high";
      due_date?: string | null;
      category_id?: number | null;
    }) => {
      const user = await getAuthenticatedUser(supabase);

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: task.title,
          description: task.description || null,
          priority: task.priority,
          due_date: task.due_date || null,
          category_id: task.category_id || null,
          status: "pending",
        })
        .select("*, task_categories(id, name, color)")
        .single();

      if (error) throw error;
      return data as TaskWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: number;
      title?: string;
      description?: string;
      priority?: "low" | "medium" | "high";
      due_date?: string | null;
      category_id?: number | null;
    }) => {
      const user = await getAuthenticatedUser(supabase);

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("*, task_categories(id, name, color)")
        .single();

      if (error) throw error;
      return data as TaskWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const user = await getAuthenticatedUser(supabase);

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useToggleTaskStatus() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: number; currentStatus: "pending" | "completed" }) => {
      const user = await getAuthenticatedUser(supabase);

      const newStatus = currentStatus === "pending" ? "completed" : "pending";

      const { data, error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", id)
        .eq("user_id", user.id)
        .select("*, task_categories(id, name, color)")
        .single();

      if (error) throw error;
      return data as TaskWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
