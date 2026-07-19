"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useTelegramLink,
  useGenerateConnectCode,
  useUnlinkTelegram,
} from "@/hooks/useTelegramBot";
import { Loader2, Bot, Unlink, ExternalLink, Copy, Check, MessageCircle } from "lucide-react";

export function TelegramSettings() {
  const { data: link, isLoading } = useTelegramLink();
  const generateCode = useGenerateConnectCode();
  const unlinkTelegram = useUnlinkTelegram();

  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    await generateCode.mutateAsync();
  };

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink your Telegram account?")) return;
    await unlinkTelegram.mutateAsync();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-muted" />
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLinked = link?.is_active && link?.chat_id > 0;
  const hasPendingCode = link?.connect_code && !link?.is_active;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle>Telegram Bot</CardTitle>
          </div>
          {isLinked ? (
            <Badge variant="default" className="bg-green-500">
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
        <CardDescription>
          Log workouts, expenses, tasks, and reminders via Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <>
            {/* Linked State */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="font-medium">Telegram Connected</span>
                <Badge variant="outline">Active</Badge>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Chat ID: {link.chat_id}</p>
                <p className="text-xs text-muted-foreground">
                  Your Telegram account is linked. Send messages to the bot to log data.
                </p>
              </div>

              {/* Usage Tips */}
              <div className="space-y-2 text-sm">
                <p className="font-medium">Try these commands:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><code>/workout push-up 30 reps</code></li>
                  <li><code>/expense food 1500 lunch</code></li>
                  <li><code>/task buy groceries high</code></li>
                  <li><code>/remind meeting tomorrow 10am</code></li>
                  <li>Or natural language: &quot;I did 30 push-ups today&quot;</li>
                </ul>
              </div>

              <Button
                variant="destructive"
                onClick={handleUnlink}
                disabled={unlinkTelegram.isPending}
              >
                {unlinkTelegram.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unlinking...
                  </>
                ) : (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    Unlink Telegram
                  </>
                )}
              </Button>
            </div>
          </>
        ) : hasPendingCode ? (
          <>
            {/* Waiting for user to message bot */}
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="text-sm font-medium">Step 1: Your connect code</p>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-mono font-bold bg-background px-4 py-2 rounded">
                    {link.connect_code}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copyCode(link.connect_code!)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Step 2: Message the bot
                </p>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Open Telegram and search for <strong>@{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "your_bot"}</strong></li>
                  <li>Send: <code>/start {link.connect_code}</code></li>
                  <li>Wait for confirmation</li>
                </ol>
              </div>

              <Button
                variant="outline"
                onClick={handleGenerateCode}
                disabled={generateCode.isPending}
              >
                {generateCode.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate New Code"
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Not connected */}
            <div className="space-y-4">
              <Button onClick={handleGenerateCode} disabled={generateCode.isPending}>
                {generateCode.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Connect Telegram
                  </>
                )}
              </Button>

              <Separator />

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">How to connect:</p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>Click &quot;Connect Telegram&quot; above</li>
                  <li>Open Telegram and click this link <a className="text-blue-500 underline cursor-pointer">@personalAssistant_2026_Bot</a></li>
                  <li>Send <code>/start YOUR_CODE</code></li>
                  <li>Done! Send messages to log data</li>
                </ol>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
