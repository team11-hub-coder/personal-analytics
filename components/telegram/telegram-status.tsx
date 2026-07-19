"use client";

import { useTelegramLink } from "@/hooks/useTelegramBot";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TelegramStatus() {
  const { data: link, isLoading } = useTelegramLink();

  if (isLoading || !link?.is_active) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="gap-1">
            <Bot className="h-3 w-3" />
            TG
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Telegram connected — data can be logged via Telegram</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
