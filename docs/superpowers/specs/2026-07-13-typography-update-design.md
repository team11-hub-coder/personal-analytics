# Typography Update Design

**Date:** 2026-07-13
**Author:** Claude Code
**Status:** Approved

## Problem

Current font size is small (browser default ~16px). Typography lacks hierarchy and feels cramped on dashboard cards. Need larger, more readable type with clear visual weight differences.

## Decision

- **Font:** Inter (swap from Geist Sans)
- **Base size:** 18px (was ~16px)
- **Approach:** CSS custom property type scale + theme.ts token updates

## Why Inter

Inter is purpose-built for UI readability at all sizes. Clean, neutral, works well with data-heavy dashboards. Geist is narrower and less readable at larger sizes.

## Implementation

### 1. Font Swap (`app/layout.tsx`)

Replace Geist → Inter:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
```

Update `<html>` class to use `inter.variable` instead of `geistSans.variable`. Keep `geistMono` for code/mono elements.

### 2. CSS Variables (`app/globals.css`)

Add base font size and type scale:

```css
html {
  font-size: 18px;
}

:root {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
}
```

Update font variables:

```css
@theme inline {
  --font-sans: var(--font-inter);
  --font-heading: var(--font-inter);
}
```

### 3. Type Scale

| Token | Size | Line Height | Use |
|-------|------|-------------|-----|
| `--text-xs` | 12px | 1rem | Badges, captions |
| `--text-sm` | 15.75px | 1.25rem | Labels, secondary text |
| `--text-base` | 18px | 1.5rem | Body text |
| `--text-lg` | 20.25px | 1.75rem | Subheadings, list titles |
| `--text-xl` | 22.5px | 1.75rem | Card values, stat numbers |
| `--text-2xl` | 27px | 2rem | Page titles |
| `--text-3xl` | 33.75px | 2.25rem | Hero stats, dashboard totals |
| `--text-4xl` | 40.5px | 2.5rem | Landing page hero |

### 4. theme.ts Token Updates

| Token | Old | New |
|-------|-----|-----|
| `pageHeader.title` | `text-2xl font-bold` | `text-2xl font-bold tracking-tight` |
| `statCard.value` | `text-xl font-bold` | `text-xl font-bold tracking-tight` |
| `sectionHeader.title` | `font-semibold` | `text-lg font-semibold` |
| `list.title` | `font-medium` | `text-base font-medium` |

Add `tracking-tight` to all headings for tighter, more modern feel.

## Files Changed

| File | Change |
|------|--------|
| `app/layout.tsx` | Swap Geist → Inter font import |
| `app/globals.css` | Add base font-size, type scale variables, update font-sans |
| `lib/theme.ts` | Update heading/stat token classes |

## Scope

- Font swap and base size only
- No changes to component structure
- No changes to spacing or layout
- Existing Tailwind classes (`text-sm`, `text-lg`) auto-scale via CSS variables
