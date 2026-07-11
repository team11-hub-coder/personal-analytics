// Timezone to currency mapping
export const timezoneCurrencyMap: Record<string, string> = {
  "Asia/Yangon": "MMK",
  "Asia/Tokyo": "JPY",
  "Asia/Singapore": "SGD",
  "Asia/Shanghai": "CNY",
  "Asia/Bangkok": "THB",
  "Asia/Jakarta": "IDR",
  "Asia/Manila": "PHP",
  "Asia/Kuala_Lumpur": "MYR",
  "Asia/Kolkata": "INR",
  "Asia/Dubai": "AED",
  "Asia/Riyadh": "SAR",
  "America/New_York": "USD",
  "America/Los_Angeles": "USD",
  "America/Chicago": "USD",
  "Europe/London": "GBP",
  "Europe/Berlin": "EUR",
  "Europe/Paris": "EUR",
  "Australia/Sydney": "AUD",
  "Pacific/Auckland": "NZD",
};

// Supported currencies with labels
export const currencies = [
  { code: "MMK", name: "Myanmar Kyat", symbol: "K" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
];

// Detect user's timezone from browser
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "Asia/Yangon"; // fallback
  }
}

// Get currency from timezone
export function getCurrencyFromTimezone(timezone: string): string {
  return timezoneCurrencyMap[timezone] || "USD";
}

// Format currency with symbol (no decimals)
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = currencies.find((c) => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

// List of common timezones for dropdown
export const timezones = [
  { value: "Asia/Yangon", label: "Myanmar (UTC+6:30)" },
  { value: "Asia/Bangkok", label: "Thailand (UTC+7)" },
  { value: "Asia/Jakarta", label: "Indonesia (UTC+7)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia (UTC+8)" },
  { value: "Asia/Manila", label: "Philippines (UTC+8)" },
  { value: "Asia/Shanghai", label: "China (UTC+8)" },
  { value: "Asia/Tokyo", label: "Japan (UTC+9)" },
  { value: "Asia/Kolkata", label: "India (UTC+5:30)" },
  { value: "Asia/Dubai", label: "UAE (UTC+4)" },
  { value: "Asia/Riyadh", label: "Saudi Arabia (UTC+3)" },
  { value: "Europe/London", label: "UK (UTC+0/+1)" },
  { value: "Europe/Berlin", label: "Germany (UTC+1/+2)" },
  { value: "America/New_York", label: "USA East (UTC-5/-4)" },
  { value: "America/Chicago", label: "USA Central (UTC-6/-5)" },
  { value: "America/Los_Angeles", label: "USA West (UTC-8/-7)" },
  { value: "Australia/Sydney", label: "Australia (UTC+10/+11)" },
  { value: "Pacific/Auckland", label: "New Zealand (UTC+12/+13)" },
];
