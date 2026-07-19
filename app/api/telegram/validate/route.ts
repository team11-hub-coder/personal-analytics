// POST /api/telegram/validate — Validate a Telegram bot token

import { NextRequest, NextResponse } from "next/server";
import { getBotInfo } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  try {
    const { botToken } = await req.json();

    if (!botToken || typeof botToken !== "string") {
      return NextResponse.json(
        { error: "Bot token is required" },
        { status: 400 }
      );
    }

    // Basic format check: should be like "123456789:ABCdefGHI..."
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
      return NextResponse.json(
        { error: "Invalid bot token format" },
        { status: 400 }
      );
    }

    // Try to get bot info from Telegram API
    const botInfo = await getBotInfo(botToken);

    if (!botInfo) {
      return NextResponse.json(
        { error: "Invalid bot token — could not connect to Telegram" },
        { status: 400 }
      );
    }

    return NextResponse.json({ botInfo });
  } catch (error) {
    console.error("Bot validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate bot token" },
      { status: 500 }
    );
  }
}
