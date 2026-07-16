# Typography Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swap Geist Sans → Inter and increase base font size from 16px to 18px with a proper type scale hierarchy.

**Architecture:** CSS custom properties define the type scale. `next/font/google` loads Inter. `theme.ts` tokens reference the new scale. Three files touched, no component changes needed.

**Tech Stack:** Next.js 16, Tailwind v4, `next/font/google`

## Global Constraints

- Next.js 16 (App Router) — check `node_modules/next/dist/docs/` for breaking changes
- Tailwind v4 — CSS-only config in `app/globals.css`, no `tailwind.config.js`
- All colors/spacing from `lib/theme.ts` — never hardcode
- shadcn/ui components in `components/ui/` — never hand-roll
- TypeScript strict — no `any`

---

### Task 1: Swap Font in Layout

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: none
- Produces: `--font-inter` CSS variable available globally

- [ ] **Step 1: Update font import**

Replace the Geist import with Inter:

```tsx
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import ThemeProvider from "@/providers/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Analytics",
  description: "Your personal analytics hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds, no font-related errors

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: swap Geist Sans → Inter font"
```

---

### Task 2: Add Type Scale CSS Variables

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `--font-inter` from Task 1
- Produces: `--text-xs` through `--text-4xl` variables, `html` base font-size

- [ ] **Step 1: Add base font size to html**

In `app/globals.css`, add `font-size: 18px` to the `html` rule in the `@layer base` block. Change:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    background-color: var(--color-bg);
    color: var(--color-text);
  }
  html {
    @apply font-sans;
  }
}
```

To:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    background-color: var(--color-bg);
    color: var(--color-text);
  }
  html {
    @apply font-sans;
    font-size: 18px;
  }
}
```

- [ ] **Step 2: Add type scale CSS variables**

In the `:root` block (the first one, around line 51), add after `--radius: 0.625rem;`:

```css
  /* Type scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
```

- [ ] **Step 3: Update font-sans to use Inter**

In the `@theme inline` block, change:

```css
  --font-sans: var(--font-sans);
```

To:

```css
  --font-sans: var(--font-inter);
```

And change:

```css
  --font-heading: var(--font-sans);
```

To:

```css
  --font-heading: var(--font-inter);
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: add 18px base font size and type scale variables"
```

---

### Task 3: Update theme.ts Token Classes

**Files:**
- Modify: `lib/theme.ts`

**Interfaces:**
- Consumes: type scale from Task 2
- Produces: updated token classes used by all components

- [ ] **Step 1: Update pageHeader.title**

In `lib/theme.ts`, find:

```tsx
  title: "text-2xl font-bold text-(--color-text)",
```

Change to:

```tsx
  title: "text-2xl font-bold tracking-tight text-(--color-text)",
```

- [ ] **Step 2: Update statCard.value**

Find:

```tsx
  value: "text-xl font-bold text-(--color-text)",
```

Change to:

```tsx
  value: "text-xl font-bold tracking-tight text-(--color-text)",
```

- [ ] **Step 3: Update sectionHeader.title**

Find:

```tsx
  title: "font-semibold text-(--color-text)",
```

Change to:

```tsx
  title: "text-lg font-semibold text-(--color-text)",
```

- [ ] **Step 4: Update list.title**

Find:

```tsx
  title: "font-medium text-(--color-text) truncate",
```

Change to:

```tsx
  title: "text-base font-medium text-(--color-text) truncate",
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add lib/theme.ts
git commit -m "feat: update theme tokens with type scale and tracking-tight"
```

---

### Task 4: Visual Verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: all changes from Tasks 1-3
- Produces: confirmed working typography

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts at http://localhost:3000

- [ ] **Step 2: Visual check**

Open http://localhost:3000 in browser. Verify:
- Body text is noticeably larger (18px)
- Page titles have tight tracking
- Card values are bold with tight tracking
- Section headers use `text-lg` size
- No font loading issues (check Network tab for Inter font files)

- [ ] **Step 3: Dark mode check**

Toggle dark mode. Verify:
- Text remains readable in dark theme
- Font weights render correctly on dark backgrounds

- [ ] **Step 4: Commit final state (if any fixes needed)**

```bash
git add -A
git commit -m "fix: typography visual adjustments"
```
