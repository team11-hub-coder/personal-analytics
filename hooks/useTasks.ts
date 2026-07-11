"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "./useAuth";
import type { Task } from "@/types";

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
}

export function useTasks(filters?: TaskFilters) {
  const supabase = createClient();
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["tasks", filters, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter by status
      if (filters?.status === "pending") {
        query = query.eq("status", "pending");
      } else if (filters?.status === "completed") {
        query = query.eq("status", "completed");
      } else if (filters?.status === "overdue") {
        // Overdue = pending AND due_date < today
        const today = new Date().toISOString().split("T")[0];
        query = query.eq("status", "pending").lt("due_date", today);
      }

      // Filter by priority
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Task[];
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
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Task;
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
    }) => {
      const user = await getAuthenticatedUser(supabase);

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
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
      const updates: { status: string; completed_at?: string | null } = {
        status: newStatus,
      };

      // Set completed_at when marking as completed, clear when marking as pending
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
