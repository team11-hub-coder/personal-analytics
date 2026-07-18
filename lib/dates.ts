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

/** Get today's date as YYYY-MM-DD in the user's local timezone. */
export function getLocalDateString(date: Date = new Date()): string {
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

/**
 * Get the UTC offset in milliseconds for a timezone at the current moment.
 * Works correctly regardless of the server's timezone.
 */
export function getUTCOffsetMs(timezone: string, date: Date): number {
  const fmtOpts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  };

  const utcParts = new Intl.DateTimeFormat("en-US", { ...fmtOpts, timeZone: "UTC" }).formatToParts(date);
  const tzParts = new Intl.DateTimeFormat("en-US", { ...fmtOpts, timeZone: timezone }).formatToParts(date);

  const val = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");

  const utcNum = Date.UTC(val(utcParts, "year"), val(utcParts, "month") - 1, val(utcParts, "day"),
    val(utcParts, "hour"), val(utcParts, "minute"), val(utcParts, "second"));
  const tzNum = Date.UTC(val(tzParts, "year"), val(tzParts, "month") - 1, val(tzParts, "day"),
    val(tzParts, "hour"), val(tzParts, "minute"), val(tzParts, "second"));

  return tzNum - utcNum;
}

/**
 * Get the current date/time in a specific IANA timezone.
 * Returns date strings for display AND UTC-equivalent ISO strings for database queries.
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

  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0");
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  const dateStr = `${String(year).padStart(2, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const hourStr = `${dateStr}T${String(hour).padStart(2, "0")}`;

  const offsetMs = getUTCOffsetMs(timezone, now);

  const startOfDayUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMs);
  const startOfHourUTC = new Date(Date.UTC(year, month - 1, day, hour, 0, 0) - offsetMs);

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
    dateStr,
    hourStr,
    datetimeStr,
    startOfDayUTC: startOfDayUTC.toISOString(),
    startOfHourUTC: startOfHourUTC.toISOString(),
  };
}
