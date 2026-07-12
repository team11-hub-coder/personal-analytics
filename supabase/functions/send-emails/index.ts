import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";

// Simple mustache-style template renderer: replaces {{key}} with values
function renderTemplate(
  html: string,
  subject: string,
  vars: Record<string, string>
): { subject: string; html: string } {
  let renderedHtml = html;
  let renderedSubject = subject;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    renderedHtml = renderedHtml.replaceAll(placeholder, value);
    renderedSubject = renderedSubject.replaceAll(placeholder, value);
  }
  return { subject: renderedSubject, html: renderedHtml };
}

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Get pending emails (max 50)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500 }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending emails", processed: 0 }),
        { status: 200 }
      );
    }

    // 2. Get active email templates
    const { data: templates } = await supabase
      .from("email_templates")
      .select("*")
      .eq("is_active", true);

    const templateMap = new Map(
      (templates || []).map((t: { template_name: string; subject: string; html_body: string }) => [
        t.template_name,
        t,
      ])
    );

    const results = [];

    for (const email of pendingEmails) {
      // Mark as processing
      await supabase
        .from("email_queue")
        .update({ status: "processing" })
        .eq("id", email.id);

      // Get user email
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        email.user_id
      );

      if (userError || !userData?.user?.email) {
        await supabase
          .from("email_queue")
          .update({ status: "failed", error_message: "User email not found" })
          .eq("id", email.id);
        results.push({ id: email.id, status: "failed", error: "User email not found" });
        continue;
      }

      // Get template
      const template = templateMap.get(email.email_type);
      if (!template) {
        await supabase
          .from("email_queue")
          .update({ status: "failed", error_message: `No template for ${email.email_type}` })
          .eq("id", email.id);
        results.push({ id: email.id, status: "failed", error: "Template not found" });
        continue;
      }

      // Parse body as template vars (the body in email_queue contains a JSON map of vars)
      let vars: Record<string, string> = {};
      try {
        vars = JSON.parse(email.body);
      } catch {
        // If body is not JSON, use it as the alert_message fallback
        vars = { alert_message: email.body };
      }

      // Add common vars
      vars.dashboard_url = APP_URL;
      vars.unsubscribe_url = `${APP_URL}/settings`;

      // Render template
      const rendered = renderTemplate(template.html_body, template.subject, vars);

      // Send email via Resend
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Personal Analytics <notifications@resend.dev>",
          to: userData.user.email,
          subject: rendered.subject,
          html: rendered.html,
        }),
      });

      if (emailResponse.ok) {
        await supabase
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email.id);
        results.push({ id: email.id, status: "sent" });
      } else {
        const errorData = await emailResponse.json();
        await supabase
          .from("email_queue")
          .update({
            status: "failed",
            error_message: errorData.message || "Email send failed",
          })
          .eq("id", email.id);
        results.push({ id: email.id, status: "failed", error: errorData });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 }
    );
  }
});
