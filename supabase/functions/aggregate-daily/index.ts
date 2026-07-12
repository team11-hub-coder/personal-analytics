// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  // Get all active users
  const { data: users } = await supabase.auth.admin.listUsers();

  for (const user of users?.users ?? []) {
    // Aggregate daily
    const { error: dailyError } = await supabase.rpc("aggregate_daily", {
      p_user_id: user.id,
      p_date: dateStr,
    });
    if (dailyError) console.error("Daily aggregation error:", dailyError);

    // If Monday, aggregate weekly
    if (yesterday.getDay() === 1) {
      const weekStart = new Date(yesterday);
      weekStart.setDate(weekStart.getDate() - 6);
      const { error: weeklyError } = await supabase.rpc("aggregate_weekly", {
        p_user_id: user.id,
        p_week_start: weekStart.toISOString().split("T")[0],
      });
      if (weeklyError) console.error("Weekly aggregation error:", weeklyError);
    }
  }

  // Archive old data (90 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .lt("date", cutoff.toISOString().split("T")[0]);
  if (deleteError) console.error("Archive error:", deleteError);

  return new Response("OK", { status: 200 });
});
