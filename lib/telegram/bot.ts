// Bot instance factory + webhook setup helper

import TelegramBot from "node-telegram-bot-api";
import crypto from "crypto";

// ─── Webhook Secret Generation ───────────────────────────────────────

export function generateWebhookSecret(): string {
  return crypto.randomBytes(24).toString("base64url");
}

// ─── Bot Instance Factory ────────────────────────────────────────────

export function createBotInstance(token: string): TelegramBot {
  return new TelegramBot(token);
}

// ─── Set Webhook ─────────────────────────────────────────────────────

export async function setBotWebhook(
  token: string,
  webhookUrl: string,
  secretToken: string
): Promise<boolean> {
  const bot = createBotInstance(token);

  try {
    const result = await bot.setWebHook(webhookUrl, {
      secret_token: secretToken,
      allowed_updates: ["message"],
      drop_pending_updates: true,
    });

    return result;
  } catch (error) {
    console.error("Failed to set webhook:", error);
    return false;
  }
}

// ─── Remove Webhook ──────────────────────────────────────────────────

export async function removeBotWebhook(token: string): Promise<boolean> {
  const bot = createBotInstance(token);

  try {
    const result = await bot.deleteWebHook({ drop_pending_updates: true });
    return result;
  } catch (error) {
    console.error("Failed to remove webhook:", error);
    return false;
  }
}

// ─── Get Bot Info ────────────────────────────────────────────────────

export async function getBotInfo(
  token: string
): Promise<{ username: string; first_name: string } | null> {
  const bot = createBotInstance(token);

  try {
    const me = await bot.getMe();
    return { username: me.username || "", first_name: me.first_name || "" };
  } catch {
    return null;
  }
}

// ─── Send Message ────────────────────────────────────────────────────

export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string
): Promise<boolean> {
  const bot = createBotInstance(token);

  try {
    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
    return true;
  } catch {
    // Retry without Markdown if parsing fails
    try {
      await bot.sendMessage(chatId, text);
      return true;
    } catch {
      return false;
    }
  }
}
