/**
 * Telegram Bot Polling Script (for local development)
 *
 * Run: npm run telegram-bot
 *
 * This script polls Telegram for updates instead of using webhooks.
 * Users link their accounts by sending: /start YOUR_CODE
 */

import { config } from "dotenv";
import { resolve } from "path";
import TelegramBot from "node-telegram-bot-api";
import { createClient } from "@supabase/supabase-js";
import { parseMessage, getHelpText } from "../lib/telegram/parser";
import { handleParsedMessage } from "../lib/telegram/handlers";

// Load .env from project root
config({ path: resolve(__dirname, "../.env") });

// Load env vars
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables");
  console.error("   Required: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  console.error("   Check your .env file");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Find user by chat_id
async function findUserByChatId(chatId: number): Promise<string | null> {
  const { data } = await supabase
    .from("telegram_links")
    .select("user_id")
    .eq("chat_id", chatId)
    .eq("is_active", true)
    .single();

  return data?.user_id || null;
}

// Link user with connect code
async function linkUserWithCode(chatId: number, code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("telegram_links")
    .update({
      chat_id: chatId,
      is_active: true,
      connect_code: null,
    })
    .eq("connect_code", code.toUpperCase())
    .eq("is_active", false)
    .select()
    .single();

  return !error && !!data;
}

async function main() {
  const bot = new TelegramBot(BOT_TOKEN!, { polling: true });

  console.log("🤖 Telegram bot started (polling mode)");
  console.log("   Users can link by sending: /start YOUR_CODE");
  console.log("   Press Ctrl+C to stop\n");

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || !msg.from) return;

    console.log(`📨 Received: "${text}" from chat ${chatId}`);

    // Handle /start with code
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const code = parts[1];

      if (code) {
        // Try to link with code
        const linked = await linkUserWithCode(chatId, code);
        if (linked) {
          await bot.sendMessage(
            chatId,
            "✅ Successfully linked!\n\nYou can now log data. Try:\n• /workout push-up 30 reps\n• /expense food 1500 lunch\n• /help for all commands"
          );
          console.log(`   ✅ Linked chat ${chatId} with code ${code}`);
          return;
        }
      }

      // Welcome message
      await bot.sendMessage(
        chatId,
        `👋 Welcome to Personal Analytics Bot!\n\nTo link your account:\n1. Go to Settings in the dashboard\n2. Click "Connect Telegram"\n3. Send: /start YOUR_CODE\n\nType /help to see all commands.`
      );
      return;
    }

    // Handle /help
    if (text === "/help") {
      await bot.sendMessage(chatId, getHelpText());
      return;
    }

    // Find user
    const userId = await findUserByChatId(chatId);

    if (!userId) {
      await bot.sendMessage(
        chatId,
        "❌ Your account is not linked.\n\nPlease go to Settings → Connect Telegram and follow the instructions."
      );
      return;
    }

    // Parse and handle message
    const parsed = parseMessage(text);

    try {
      const response = await handleParsedMessage(userId, parsed);
      await bot.sendMessage(chatId, response);
      console.log(`   ✅ Processed: ${parsed.module}`);
    } catch (error) {
      console.error("   ❌ Error:", error);
      await bot.sendMessage(chatId, "❌ Something went wrong. Please try again.");
    }
  });

  bot.on("polling_error", (error) => {
    console.error("Polling error:", error.message);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Stopping bot...");
    await bot.stopPolling();
    process.exit(0);
  });
}

main();
