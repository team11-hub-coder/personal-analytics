"use client";

import { useState } from "react";
import { useDailySummary } from "@/hooks/useAI";
import { card, sectionHeader } from "@/lib/theme";
import { Sparkles, RefreshCw, Loader2, Lightbulb, Target } from "lucide-react";
import type { DailySummary } from "@/hooks/useAI";

export default function DailySummaryCard() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const generateSummary = useDailySummary();

  const handleGenerate = () => {
    generateSummary.mutate(undefined, {
      onSuccess: (data) => setSummary(data),
    });
  };

  return (
    <div className={card.base}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${sectionHeader.title} flex items-center gap-2`}>
          <Sparkles size={16} className="text-amber-500" />
          Daily Summary
        </h3>
        <button
          onClick={handleGenerate}
          disabled={generateSummary.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border) disabled:opacity-50"
        >
          {generateSummary.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          {summary ? "Refresh" : "Generate"}
        </button>
      </div>

      {generateSummary.isPending ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 size={24} className="animate-spin text-(--color-primary)" />
          <p className="text-xs text-(--color-text-muted)">Analyzing your day...</p>
        </div>
      ) : summary ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{summary.emoji}</span>
            <p className="text-sm text-(--color-text) leading-relaxed">{summary.summary}</p>
          </div>

          {summary.highlights.length > 0 && (
            <div className="space-y-1.5">
              {summary.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Target size={10} className="text-emerald-500 shrink-0" />
                  <span className="text-(--color-text-secondary)">{h}</span>
                </div>
              ))}
            </div>
          )}

          {summary.suggestion && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs">
              <Lightbulb size={12} className="shrink-0 mt-0.5" />
              <span>{summary.suggestion}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center p-2 rounded-lg bg-(--color-surface-hover)">
              <p className="text-base font-bold text-(--color-text)">{summary.stats.calories}</p>
              <p className="text-xs text-(--color-text-muted)">cal burned</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-(--color-surface-hover)">
              <p className="text-base font-bold text-(--color-text)">{summary.stats.tasksCompleted}</p>
              <p className="text-xs text-(--color-text-muted)">tasks done</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-(--color-surface-hover)">
              <p className="text-base font-bold text-(--color-text)">{summary.stats.focusMinutes}m</p>
              <p className="text-xs text-(--color-text-muted)">focus time</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Sparkles size={24} className="mx-auto mb-2 text-(--color-text-muted)" />
          <p className="text-xs text-(--color-text-muted)">
            Click Generate to get your AI-powered daily summary
          </p>
        </div>
      )}
    </div>
  );
}
