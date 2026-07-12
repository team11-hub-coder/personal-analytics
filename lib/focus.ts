import { createClient } from "@/utils/supabase/client";
import type { FocusSession } from "@/types";

function getClient() {
  return createClient();
}

function isTableMissing(error: { code?: string; message?: string }): boolean {
  // Empty error object (404 from Supabase REST) means the table doesn't exist
  if (!error.code && !error.message) return true;
  return (
    error.code === "42P01" || // undefined_table
    error.code === "42703" || // undefined_column
    error.message?.includes("does not exist") === true ||
    error.message?.includes("relation") === true ||
    error.message?.includes("column") === true
  );
}

function isRlsBlocked(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "42501" || // insufficient_privilege (RLS violation)
    error.message?.includes("row-level security") === true
  );
}

export async function getFocusSessions(limit = 20): Promise<{
  data: FocusSession[];
  tableMissing: boolean;
}> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("focus_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isTableMissing(error)) {
      return { data: [], tableMissing: true };
    }
    console.error("Error fetching focus sessions:", error);
    return { data: [], tableMissing: false };
  }

  return { data: (data as FocusSession[]) ?? [], tableMissing: false };
}

export async function addFocusSession(
  session: Omit<FocusSession, "id" | "created_at">
): Promise<{ data: FocusSession | null; tableMissing: boolean }> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("focus_sessions")
    .insert(session)
    .select()
    .single();

  if (error) {
    if (isTableMissing(error)) {
      return { data: null, tableMissing: true };
    }
    if (isRlsBlocked(error)) {
      console.error("RLS policy blocked insert. Ensure the policy exists and user is authenticated:", error);
    } else {
      console.error("Error adding focus session:", error);
    }
    return { data: null, tableMissing: false };
  }

  return { data: data as FocusSession, tableMissing: false };
}

export async function deleteFocusSession(id: string): Promise<boolean> {
  const supabase = getClient();
  const { error } = await supabase.from("focus_sessions").delete().eq("id", id);
  if (error) {
    console.error("Error deleting focus session:", error);
    return false;
  }
  return true;
}

export async function updateFocusSession(
  id: string,
  updates: Partial<FocusSession>
): Promise<FocusSession | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("focus_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating focus session:", error);
    return null;
  }

  return data as FocusSession;
}

export async function incrementCompletedCount(id: string): Promise<boolean> {
  const supabase = getClient();

  // Read current count
  const { data, error: readError } = await supabase
    .from("focus_sessions")
    .select("completed_count")
    .eq("id", id)
    .single();

  if (readError) {
    console.error("Error reading session for count increment:", readError);
    return false;
  }

  // Increment and save
  const newCount = (data?.completed_count ?? 0) + 1;
  const { error: updateError } = await supabase
    .from("focus_sessions")
    .update({ completed_count: newCount })
    .eq("id", id);

  if (updateError) {
    console.error("Error updating completed_count:", updateError);
    return false;
  }

  return true;
}

export async function getTodayFocusMinutes(): Promise<number> {
  const supabase = getClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("duration_minutes")
    .gte("started_at", today.toISOString())
    .eq("completed", true);

  if (error) {
    console.error("Error fetching today focus:", error);
    return 0;
  }

  return (data as Pick<FocusSession, "duration_minutes">[]).reduce(
    (sum, s) => sum + s.duration_minutes,
    0
  );
}

export async function getWeekFocusMinutes(): Promise<number> {
  const supabase = getClient();
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("duration_minutes")
    .gte("started_at", weekAgo.toISOString())
    .eq("completed", true);

  if (error) {
    console.error("Error fetching week focus:", error);
    return 0;
  }

  return (data as Pick<FocusSession, "duration_minutes">[]).reduce(
    (sum, s) => sum + s.duration_minutes,
    0
  );
}
