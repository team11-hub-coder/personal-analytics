// POST /api/telegram — Telegram webhook handler
// Receives updates from Telegram, verifies secret, parses message, inserts data

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseMessage, getHelpText } from "@/lib/telegram/parser";
import { handleParsedMessage } from "@/lib/telegram/handlers";
import { sendTelegramMessage } from "@/lib/telegram/bot";

// Service role client for server-side queries
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Telegram secret token
    const secretToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!secretToken || !expectedSecret || secretToken !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the Telegram update
    const update = await req.json();
    const message = update.message;

    if (!message || !message.text || !message.from) {
      return NextResponse.json({ ok: true }); // Nothing to process
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not set");
      return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();

    // 3. Handle /start command (with optional connect code)
    if (text.startsWith("/start")) {
      const code = text.replace("/start", "").trim();

      if (code) {
        // User is linking their account via connect code
        const { data: link, error: linkError } = await supabase
          .from("telegram_links")
          .select("user_id")
          .eq("connect_code", code)
          .eq("is_active", false)
          .single();

        if (linkError || !link) {
          await sendTelegramMessage(
            botToken,
            chatId,
            "❌ Invalid or expired connect code. Please generate a new one from the dashboard."
          );
          return NextResponse.json({ ok: true });
        }

        // Link the Telegram chat to the user
        const { error: updateError } = await supabase
          .from("telegram_links")
          .update({
            chat_id: chatId,
            is_active: true,
            connect_code: null, // Clear the code after use
          })
          .eq("user_id", link.user_id);

        if (updateError) {
          console.error("Failed to link Telegram:", updateError);
          await sendTelegramMessage(
            botToken,
            chatId,
            "❌ Failed to link account. Please try again."
          );
          return NextResponse.json({ ok: true });
        }

        await sendTelegramMessage(
          botToken,
          chatId,
          "✅ Account linked successfully!\n\nYou can now log workouts, expenses, tasks, and reminders directly from Telegram.\n\nType /help to see all available commands."
        );
        return NextResponse.json({ ok: true });
      }

      // Regular /start without code
      await sendTelegramMessage(
        botToken,
        chatId,
        "👋 Welcome to your Personal Analytics Bot!\n\nI can help you log workouts, expenses, tasks, and reminders directly from Telegram.\n\nType /help to see all available commands."
      );
      return NextResponse.json({ ok: true });
    }

    // 4. Look up which user owns this chat
    const { data: link, error: linkError } = await supabase
      .from("telegram_links")
      .select("user_id")
      .eq("chat_id", chatId)
      .eq("is_active", true)
      .single();

    if (linkError || !link) {
      await sendTelegramMessage(
        botToken,
        chatId,
        "❌ Your Telegram account is not linked. Please link it from the dashboard first."
      );
      return NextResponse.json({ ok: true });
    }

    const userId = link.user_id;

    // 5. Parse the message
    const parsed = parseMessage(text);

    // 6. Handle help command
    if (parsed.module === "help") {
      await sendTelegramMessage(botToken, chatId, getHelpText());
      return NextResponse.json({ ok: true });
    }

    // 7. Process the parsed message
    const response = await handleParsedMessage(userId, parsed);

    // 8. Send confirmation back to user
    await sendTelegramMessage(botToken, chatId, response);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
