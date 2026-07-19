import { createClient } from "@/utils/supabase/server";

/** Rate limits */
const DAILY_LIMIT = 20;
const HOURLY_LIMIT = 5;

/**
 * Get the UTC offset in milliseconds for a given IANA timezone at the current moment.
 * Works correctly regardless of the server's timezone.
 */
function getUTCOffsetMs(timezone: string, date: Date): number {
  const fmtOpts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  };

  const utcParts = new Intl.DateTimeFormat("en-US", {
    ...fmtOpts,
    timeZone: "UTC",
  }).formatToParts(date);
  const tzParts = new Intl.DateTimeFormat("en-US", {
    ...fmtOpts,
    timeZone: timezone,
  }).formatToParts(date);

  const val = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");

  const utcNum = Date.UTC(
    val(utcParts, "year"),
    val(utcParts, "month") - 1,
    val(utcParts, "day"),
    val(utcParts, "hour"),
    val(utcParts, "minute"),
    val(utcParts, "second")
  );
  const tzNum = Date.UTC(
    val(tzParts, "year"),
    val(tzParts, "month") - 1,
    val(tzParts, "day"),
    val(tzParts, "hour"),
    val(tzParts, "minute"),
    val(tzParts, "second")
  );

  return tzNum - utcNum;
}

/**
 * Get the current date/time parts in a specific IANA timezone.
 * Returns UTC-equivalent ISO strings for database queries and a human-readable datetime string.
 */
export function getLocalNow(timezone: string) {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");

  const offsetMs = getUTCOffsetMs(timezone, now);

  const startOfDayUTC = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMs
  );
  const startOfHourUTC = new Date(
    Date.UTC(year, month - 1, day, hour, 0, 0) - offsetMs
  );

  const datetimeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    weekday: "long",
  }).format(now);

  return {
    startOfDayUTC: startOfDayUTC.toISOString(),
    startOfHourUTC: startOfHourUTC.toISOString(),
    datetimeStr,
  };
}

export type RateLimitResult = {
  allowed: boolean;
  error?: string;
  dailyUsed: number;
  hourlyUsed: number;
};

/**
 * Check if user has exceeded rate limits.
 */
export async function checkRateLimit(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  timezone: string
): Promise<RateLimitResult> {
  const { startOfDayUTC, startOfHourUTC } = getLocalNow(timezone);

  const { count: dailyUsed } = await supabase
    .from("chat_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDayUTC);

  if ((dailyUsed || 0) >= DAILY_LIMIT) {
    return {
      allowed: false,
      error: `Daily limit reached (${DAILY_LIMIT} messages). Try again tomorrow.`,
      dailyUsed: dailyUsed || 0,
      hourlyUsed: 0,
    };
  }

  const { count: hourlyUsed } = await supabase
    .from("chat_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfHourUTC);

  if ((hourlyUsed || 0) >= HOURLY_LIMIT) {
    return {
      allowed: false,
      error: `Hourly limit reached (${HOURLY_LIMIT} messages). Try again later.`,
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
 */
export async function recordUsage(
  userId: string,
  label: string,
  responseLength: number,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  try {
    const inputTokens = Math.ceil(label.length / 4);
    const outputTokens = Math.ceil(responseLength / 4);

    const { error } = await supabase.from("chat_usage").insert({
      user_id: userId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      model: "gemini-3-flash-preview",
    });

    if (error) {
      console.error("Failed to record usage:", error.message);
    }
  } catch (error) {
    console.error("Failed to record usage:", error);
  }
}

/**
 * Fetch user timezone from profile, defaults to UTC.
 */
export async function getUserTimezone(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .single();
    return data?.timezone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Get current usage stats for the user.
 */
export async function getUsageStats(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  timezone: string
): Promise<{
  daily: { used: number; limit: number };
  hourly: { used: number; limit: number };
}> {
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
    daily: { used: dailyUsed || 0, limit: DAILY_LIMIT },
    hourly: { used: hourlyUsed || 0, limit: HOURLY_LIMIT },
  };
}

export { DAILY_LIMIT, HOURLY_LIMIT };
