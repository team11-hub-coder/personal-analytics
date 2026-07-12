"use client";

import type { FocusPhase } from "@/types";

interface FocusTimerProps {
  timeRemaining: number;
  totalTime: number;
  phase: FocusPhase;
  sessionCount: number;
  totalSessions: number;
  isStopwatch?: boolean;
  stopwatchElapsed?: number;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const phaseLabels: Record<FocusPhase, string> = {
  idle: "Ready to Focus",
  focus: "Focus Time",
  break: "Short Break",
  longBreak: "Long Break",
};

const phaseColors: Record<FocusPhase, string> = {
  idle: "var(--color-text-secondary)",
  focus: "#8b6914",
  break: "#10b981",
  longBreak: "#3b82f6",
};

export default function FocusTimer({
  timeRemaining,
  totalTime,
  phase,
  sessionCount,
  totalSessions,
  isStopwatch = false,
  stopwatchElapsed = 0,
}: FocusTimerProps) {
  const radius = 120;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  // Stopwatch: progress fills up as time passes (resets every hour)
  const progress = isStopwatch
    ? (stopwatchElapsed % 3600) / 3600
    : totalTime > 0
      ? (totalTime - timeRemaining) / totalTime
      : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const color = isStopwatch ? "#8b6914" : phaseColors[phase];
  const displayTime = isStopwatch ? stopwatchElapsed : timeRemaining;
  const label = isStopwatch
    ? phase === "idle"
      ? "Stopwatch"
      : "Timing..."
    : phaseLabels[phase];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular timer */}
      <div className="relative">
        <svg width={radius * 2} height={radius * 2} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-mono font-bold"
            style={{ color }}
          >
            {formatTime(displayTime)}
          </span>
          <span className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
            {label}
          </span>
        </div>
      </div>

      {/* Session counter (pomodoro mode) */}
      {totalSessions > 1 && (
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSessions }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-colors"
              style={{
                backgroundColor:
                  i < sessionCount ? color : "var(--color-border)",
              }}
            />
          ))}
          <span className="text-sm ml-2" style={{ color: "var(--color-text-secondary)" }}>
            Session {sessionCount + 1} of {totalSessions}
          </span>
        </div>
      )}
    </div>
  );
}
