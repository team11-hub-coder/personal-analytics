/**
 * Shared rate limiting utilities for AI routes.
 * Tracks usage in the `chat_usage` table.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getLocalNow } from "@/lib/dates";

/** Default rate limits */
const DEFAULT_DAILY_LIMIT = 20;
const DEFAULT_HOURLY_LIMIT = 5;

interface RateLimitResult {
  allowed: boolean;
  error?: string;
  dailyUsed: number;
  hourlyUsed: number;
}

interface UsageStats {
  daily: { used: number; limit: number };
  hourly: { used: number; limit: number };
}

/**
 * Check if user has exceeded rate limits.
 *
 * @param userId - The user's ID
 * @param supabase - Supabase client
 * @param timezone - User's IANA timezone
 * @param limits - Optional custom limits (defaults to 20/day, 5/hour)
 */
export async function checkRateLimit(
  userId: string,
  supabase: SupabaseClient,
  timezone: string,
  limits?: { daily?: number; hourly?: number }
): Promise<RateLimitResult> {
  const dailyLimit = limits?.daily ?? DEFAULT_DAILY_LIMIT;
  const hourlyLimit = limits?.hourly ?? DEFAULT_HOURLY_LIMIT;
  const { startOfDayUTC, startOfHourUTC } = getLocalNow(timezone);

  // Check daily limit
  const { count: dailyUsed } = await supabase
    .from("chat_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDayUTC);

  if ((dailyUsed || 0) >= dailyLimit) {
    return {
      allowed: false,
      error: `Daily limit reached (${dailyLimit} messages). Try again tomorrow.`,
      dailyUsed: dailyUsed || 0,
      hourlyUsed: 0,
    };
  }

  // Check hourly limit
  const { count: hourlyUsed } = await supabase
    .from("chat_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfHourUTC);

  if ((hourlyUsed || 0) >= hourlyLimit) {
    return {
      allowed: false,
      error: `Hourly limit reached (${hourlyLimit} messages). Try again later.`,
      dailyUsed: dailyUsed || 0,
      hourlyUsed: hourlyUsed || 0,
    };
  }

  return {
    allowed: true,
    dailyUsed: dailyUsed || 0,
    hourlyUsed: hourlyUsed || 0,
  };
}

/**
 * Record usage for cost tracking and analytics.
 *
 * @param userId - The user's ID
 * @param userMessage - The user's message content
 * @param assistantMessage - The AI's response content
 * @param supabase - Supabase client
 * @param model - Model name (defaults to gemini-3-flash-preview)
 */
export async function recordUsage(
  userId: string,
  userMessage: string,
  assistantMessage: string,
  supabase: SupabaseClient,
  model = "gemini-3-flash-preview"
): Promise<void> {
  try {
    const inputTokens = Math.ceil(userMessage.length / 4);
    const outputTokens = Math.ceil(assistantMessage.length / 4);

    const { error } = await supabase.from("chat_usage").insert({
      user_id: userId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      model,
    });

    if (error) {
      console.error("Failed to record usage:", error.message);
    }
  } catch (error) {
    console.error("Failed to record usage:", error);
  }
}

/**
 * Get current usage stats for the user.
 *
 * @param userId - The user's ID
 * @param supabase - Supabase client
 * @param timezone - User's IANA timezone
 * @param limits - Optional custom limits
 */
export async function getUsageStats(
  userId: string,
  supabase: SupabaseClient,
  timezone: string,
  limits?: { daily?: number; hourly?: number }
): Promise<UsageStats> {
  const dailyLimit = limits?.daily ?? DEFAULT_DAILY_LIMIT;
  const hourlyLimit = limits?.hourly ?? DEFAULT_HOURLY_LIMIT;
  const { startOfDayUTC, startOfHourUTC } = getLocalNow(timezone);

  const { count: dailyUsed, error: dailyError } = await supabase
    .from("chat_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDayUTC);

  const { count: hourlyUsed, error: hourlyError } = await supabase
    .from("chat_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfHourUTC);

  if (dailyError) console.error("Daily usage query error:", dailyError.message);
  if (hourlyError) console.error("Hourly usage query error:", hourlyError.message);

  return {
    daily: { used: dailyUsed || 0, limit: dailyLimit },
    hourly: { used: hourlyUsed || 0, limit: hourlyLimit },
  };
}
