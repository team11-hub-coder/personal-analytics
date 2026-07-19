/**
 * Timezone-safe date utilities.
 *
 * Problem: `new Date(isoString)` and `toISOString()` always use UTC,
 * but our DB columns are `date` (calendar date) and users think in local time.
 *
 * Rules:
 *  - When WRITING a `date` column → send local YYYY-MM-DD string
 *  - When READING a `date` column → parse as local midnight, not UTC midnight
 *  - When WRITING a `timestamptz` column → send full ISO with offset
 *  - When READING a `timestamptz` column → JS Date handles conversion automatically
 */

/**
 * Get the configured timezone for server-side code.
 * On cloud servers (Vercel, etc.) the runtime is UTC by default.
 * Set TZ=Asia/Yangon (or your timezone) in .env.local to fix this.
 */
function getServerTimezone(): string {
  return process.env.TZ || "UTC";
}

/**
 * Format a Date as YYYY-MM-DD in the given timezone.
 * Uses Intl.DateTimeFormat for correct DST handling.
 */
function formatInTimezone(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);
  // en-CA produces YYYY-MM-DD
}

/** Get today's date as YYYY-MM-DD in the configured timezone (TZ env var, or system local). */
export function getLocalDateString(date: Date = new Date()): string {
  const tz = getServerTimezone();
  // If TZ is set, use Intl to format in that timezone
  if (process.env.TZ) {
    return formatInTimezone(date, tz);
  }
  // Otherwise fall back to system local time (works on local dev machines)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD date-only string as LOCAL time (not UTC).
 *
 * `new Date("2024-07-12")` → UTC midnight → wrong for comparisons in UTC+ timezones.
 * This function → local midnight → correct.
 */
export function parseLocalDate(dateString: string): Date {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Convert a Date object to a datetime-local input value (YYYY-MM-DDTHH:MM)
 * in the user's local timezone.
 */
export function toLocalDatetimeString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

/**
 * Convert a datetime-local input value (YYYY-MM-DDTHH:MM, no timezone)
 * to a full ISO string with the local timezone offset appended.
 *
 * Input:  "2024-07-12T14:00" (user's local time)
 * Output: "2024-07-12T14:00:00+06:30" (timezone-annotated)
 *
 * This ensures Postgres timestamptz stores the correct absolute instant.
 */
export function toISOWithOffset(datetimeLocal: string): string {
  const date = new Date(datetimeLocal);
  const offset = -date.getTimezoneOffset(); // in minutes, positive = east of UTC
  const sign = offset >= 0 ? "+" : "-";
  const absOffset = Math.abs(offset);
  const offsetH = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const offsetM = String(absOffset % 60).padStart(2, "0");
  return `${datetimeLocal}:00${sign}${offsetH}:${offsetM}`;
}

/**
 * Compute the difference in whole days between a date-only string and today.
 * Returns negative for past, 0 for today, positive for future.
 */
export function daysFromToday(dateString: string): number {
  const target = parseLocalDate(dateString);
  const today = parseLocalDate(getLocalDateString());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
