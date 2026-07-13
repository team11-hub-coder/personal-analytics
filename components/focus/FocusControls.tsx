"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FocusPhase } from "@/types";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";

interface FocusControlsProps {
  phase: FocusPhase;
  isRunning: boolean;
  mode: "pomodoro" | "custom" | "stopwatch";
  title: string;
  customFocus: number;
  customBreak: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onModeChange: (mode: "pomodoro" | "custom" | "stopwatch") => void;
  onTitleChange: (title: string) => void;
  onCustomFocusChange: (minutes: number) => void;
  onCustomBreakChange: (minutes: number) => void;
}

export default function FocusControls({
  phase,
  isRunning,
  mode,
  title,
  customFocus,
  customBreak,
  onStart,
  onPause,
  onReset,
  onSkip,
  onModeChange,
  onTitleChange,
  onCustomFocusChange,
  onCustomBreakChange,
}: FocusControlsProps) {
  const isIdle = phase === "idle";
  const showTitle = mode === "custom" && isIdle;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs">
      {/* Mode selector */}
      <div className="flex gap-2 w-full">
        <button
          onClick={() => onModeChange("pomodoro")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === "pomodoro"
              ? "bg-[#8b6914] text-white"
              : "bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border)"
          }`}
        >
          Pomodoro
        </button>
        <button
          onClick={() => onModeChange("custom")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === "custom"
              ? "bg-[#8b6914] text-white"
              : "bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border)"
          }`}
        >
          Custom
        </button>
        <button
          onClick={() => onModeChange("stopwatch")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === "stopwatch"
              ? "bg-[#8b6914] text-white"
              : "bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border)"
          }`}
        >
          Stopwatch
        </button>
      </div>

      {/* Title input (custom/stopwatch modes) */}
      {showTitle && (
        <div className="w-full space-y-1">
          <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Session Title
          </Label>
          <Input
            type="text"
            placeholder="e.g. Deep work, Reading, Study..."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
      )}

      {/* Custom duration inputs */}
      {mode === "custom" && isIdle && (
        <div className="flex gap-4 w-full">
          <div className="flex-1 space-y-1">
            <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Focus (min)
            </Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={customFocus}
              onChange={(e) => onCustomFocusChange(Number(e.target.value) || 1)}
              className="text-center"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Break (min)
            </Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={customBreak}
              onChange={(e) => onCustomBreakChange(Number(e.target.value) || 1)}
              className="text-center"
            />
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          className="h-12 w-12 rounded-full"
        >
          <RotateCcw size={18} />
        </Button>

        <Button
          size="icon"
          onClick={isRunning ? onPause : onStart}
          className="h-16 w-16 rounded-full bg-[#8b6914] hover:bg-[#a07d1a] text-white"
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onSkip}
          disabled={isIdle || mode === "stopwatch"}
          className="h-12 w-12 rounded-full"
        >
          <SkipForward size={18} />
        </Button>
      </div>
    </div>
  );
}
