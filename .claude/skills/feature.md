# Skill: Feature

Triggered by: add, create, implement, update, modify, change, fix, bug, feature, page, module

When user mentions any of these keywords, silently do ALL of this:

## Step 1: Identify operation type

- **Add/Create/Implement** → Create new files + update types + validations
- **Update/Modify/Change** → Read existing files + update in place
- **Fix/Bug** → Read existing files + find issue + fix

## Step 2: Read these files first

- `types/index.ts` — current row interfaces
- `lib/validations.ts` — current Zod schemas
- `hooks/use<Module>.ts` — current hooks (if exists)
- `app/(app)/<module>/page.tsx` — current page (if exists)
- `components/<module>/` — current components (if exists)
- `lib/theme.ts` — styling tokens
- `components/ui/` — available shadcn components

## Step 3: Apply changes

### If ADDING new feature:
1. Add row interface to `types/index.ts`
2. Add Zod schema to `lib/validations.ts`
3. Create `hooks/use<Module>.ts` (useQuery + useMutation)
4. Create `app/(app)/<module>/page.tsx` (skeleton + empty state)
5. Create `components/<module>/` (forms/lists with shadcn + theme.ts)

### If UPDATING existing feature:
1. Update `types/index.ts` if fields changed
2. Update `lib/validations.ts` if fields changed
3. Update `hooks/use<Module>.ts` if queries/mutations changed
4. Update `app/(app)/<module>/page.tsx`
5. Update `components/<module>/`

### If FIXING bug:
1. Read the buggy file
2. Find the root cause
3. Fix it while preserving existing patterns
4. Verify `npm run build` passes

## Code Patterns (use these always)

### Hook
```typescript
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export function use<Module>() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["<table>"],
    queryFn: async () => {
      const { data, error } = await supabase.from("<table>").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreate<Module>() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: <FormData>) => {
      const { error } = await supabase.from("<table>").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["<table>"] }),
  });
}
```

### Page
```typescript
"use client";
import { pageHeader } from "@/lib/theme";
import { Skeleton } from "@/components/ui/skeleton";

export default function <Module>Page() {
  const { data, isLoading } = use<Module>();
  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageHeader.title}>Title</h1>
        <p className={pageHeader.subtitle}>Description</p>
      </div>
      {isLoading && <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>}
      {!isLoading && data?.length === 0 && <p className="text-[var(--color-text-muted)] text-sm">Empty</p>}
      {data && data.length > 0 && <div>{/* list */}</div>}
    </div>
  );
}
```

### Button Spinner
```typescript
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
<Button disabled={mutation.isPending}>
  {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save"}
</Button>
```

## Rules

- NEVER hardcode colors — use `lib/theme.ts`
- NEVER hand-roll UI — use `components/ui/`
- NEVER mix UI and data logic — pages are UI only, hooks are data only
- NEVER use `any` — always proper types
- ALWAYS use skeleton loading (not "Loading..." text)
- ALWAYS show button spinner during mutations
- ALWAYS verify `npm run build` passes
