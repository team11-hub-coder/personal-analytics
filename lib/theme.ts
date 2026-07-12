/**
 * Centralized Theme Configuration
 *
 * All design tokens and reusable classNames live here.
 * To customize for a new project, only edit this file.
 */

// ─── Color Tokens ──────────────────────────────────────────────
// These map to CSS variables in globals.css
export const colors = {
  primary: {
    DEFAULT: "var(--color-primary)",
    hover: "var(--color-primary-hover)",
  },
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  bg: "var(--color-bg)",
  surface: "var(--color-surface)",
  surfaceHover: "var(--color-surface-hover)",
  border: "var(--color-border)",
  text: {
    DEFAULT: "var(--color-text)",
    secondary: "var(--color-text-secondary)",
    muted: "var(--color-text-muted)",
  },
  sidebar: {
    bg: "var(--color-sidebar-bg)",
    hover: "var(--color-sidebar-hover)",
  },
  gradient: {
    from: "var(--color-accent-gradient-from)",
    to: "var(--color-accent-gradient-to)",
  },
} as const;

// ─── Reusable ClassNames ───────────────────────────────────────

// Cards
export const card = {
  base: "bg-(--color-surface) rounded-xl p-6 shadow-sm border border-(--color-border)",
  compact: "bg-(--color-surface) rounded-xl p-5 shadow-sm border border-(--color-border)",
  hover: "bg-(--color-surface) rounded-xl p-6 shadow-sm border border-(--color-border) hover:shadow-md transition-shadow",
} as const;

// Stat Cards (icon + label + value)
export const statCard = {
  container:
    "bg-(--color-surface) rounded-xl p-5 shadow-sm border border-(--color-border)",
  iconWrapper: "w-10 h-10 rounded-lg flex items-center justify-center",
  label: "text-sm text-(--color-text-secondary)",
  value: "text-xl font-bold text-(--color-text)",
} as const;

// Stat card icon colors
export const statColors = {
  gold: "bg-[#f3ece3] text-[#8b6914]",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  blue: "bg-blue-50 text-blue-600",
  orange: "bg-orange-50 text-orange-600",
} as const;

// Page headers
export const pageHeader = {
  container: "flex items-center justify-between",
  title: "text-2xl font-bold text-(--color-text)",
  subtitle: "text-(--color-text-secondary) mt-1",
} as const;

// Buttons
export const button = {
  primary:
    "bg-(--color-primary) hover:bg-(--color-primary-hover) text-white",
  secondary:
    "bg-(--color-surface-hover) hover:bg-(--color-surface-hover) text-(--color-text-secondary)",
  outline:
    "border border-(--color-border) hover:bg-(--color-surface-hover)",
  ghost: "hover:bg-(--color-surface-hover)",
  danger: "bg-red-500 hover:bg-red-600 text-white",
} as const;

// Forms
export const input = {
  base: "border-(--color-border) focus:ring-(--color-primary)",
  label: "text-(--color-text-secondary)",
  error: "text-sm text-red-500",
} as const;

// Sidebar
export const sidebar = {
  link: "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
  linkActive: "bg-(--color-primary) text-white font-semibold",
  linkInactive:
    "text-slate-300 hover:bg-(--color-sidebar-hover) hover:text-white",
  footerButton:
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-(--color-sidebar-hover) hover:text-white transition-colors w-full",
} as const;

// Section headers
export const sectionHeader = {
  title: "font-semibold text-(--color-text)",
  subtitle: "text-(--color-text-muted) text-sm",
} as const;

// Empty states
export const emptyState = {
  text: "text-(--color-text-muted) text-sm",
} as const;

// Lists
export const list = {
  item:
    "flex items-center gap-3 text-sm",
  iconCircle: "w-8 h-8 rounded-full flex items-center justify-center",
  title: "font-medium text-(--color-text) truncate",
  subtitle: "text-(--color-text-secondary) text-xs",
  badge: "text-xs px-2 py-0.5 rounded-full",
} as const;

// Quick actions
export const quickAction = {
  base: "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-(--color-surface-hover) hover:bg-(--color-surface-hover) transition-colors text-sm font-medium text-(--color-text-secondary)",
  dot: "w-2 h-2 rounded-full",
} as const;

// ─── Chart Colors ──────────────────────────────────────────────
export const chartColors = [
  "#8b6914", // gold
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#c9a96e", // light gold
  "#06b6d4", // cyan
  "#d97706", // orange
] as const;
