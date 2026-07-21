"use client";

import { useState } from "react";
import { useSpendingInsights } from "@/hooks/useAI";
import { card, sectionHeader } from "@/lib/theme";
import { formatCurrency } from "@/lib/currency";
import { TrendingUp, RefreshCw, Loader2, AlertTriangle, Lightbulb, Trophy } from "lucide-react";
import type { SpendingInsightsResult } from "@/hooks/useAI";

const insightIcons: Record<string, typeof TrendingUp> = {
  trend: TrendingUp,
  warning: AlertTriangle,
  tip: Lightbulb,
  achievement: Trophy,
};

const insightColors: Record<string, string> = {
  trend: "bg-blue-50 text-blue-600",
  warning: "bg-red-50 text-red-600",
  tip: "bg-emerald-50 text-emerald-600",
  achievement: "bg-amber-50 text-amber-600",
};

export default function SpendingInsightsCard() {
  const [insights, setInsights] = useState<SpendingInsightsResult | null>(null);
  const generateInsights = useSpendingInsights();

  const handleGenerate = () => {
    generateInsights.mutate(undefined, {
      onSuccess: (data) => setInsights(data),
    });
  };

  return (
    <div className={card.base}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${sectionHeader.title} flex items-center gap-2`}>
          <TrendingUp size={16} className="text-blue-500" />
          Spending Insights
        </h3>
        <button
          onClick={handleGenerate}
          disabled={generateInsights.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-(--color-surface-hover) text-(--color-text-secondary) hover:bg-(--color-border) disabled:opacity-50"
        >
          {generateInsights.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          {insights ? "Refresh" : "Analyze"}
        </button>
      </div>

      {generateInsights.isPending ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 size={24} className="animate-spin text-(--color-primary)" />
          <p className="text-xs text-(--color-text-muted)">Analyzing your spending...</p>
        </div>
      ) : insights ? (
        <div className="space-y-3">
          {/* Budget status */}
          {insights.budgetStatus !== "no_budget" && (
            <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
              insights.budgetStatus === "under"
                ? "bg-emerald-50 text-emerald-700"
                : insights.budgetStatus === "over"
                  ? "bg-red-50 text-red-700"
                  : "bg-blue-50 text-blue-700"
            }`}>
              <span className="text-lg">
                {insights.budgetStatus === "under" ? "✓" : insights.budgetStatus === "over" ? "!" : "→"}
              </span>
              <span>
                {insights.budgetStatus === "under" && `Under budget — ${formatCurrency(insights.totalSpent, insights.currency)} spent`}
                {insights.budgetStatus === "over" && `Over budget — ${formatCurrency(insights.totalSpent, insights.currency)} spent`}
                {insights.budgetStatus === "on_track" && `On track — ${formatCurrency(insights.totalSpent, insights.currency)} spent`}
              </span>
            </div>
          )}

          {/* Top category */}
          {insights.topCategory && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-(--color-surface-hover) text-xs">
              <span className="text-(--color-text-secondary)">Top category</span>
              <span className="font-medium text-(--color-text)">
                {insights.topCategory} ({formatCurrency(insights.topCategoryAmount, insights.currency)})
              </span>
            </div>
          )}

          {/* Insights list */}
          {insights.insights.map((insight, i) => {
            const Icon = insightIcons[insight.type] || TrendingUp;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${insightColors[insight.type] || "bg-gray-50 text-gray-600"}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-(--color-text)">{insight.title}</p>
                  <p className="text-xs text-(--color-text-secondary) mt-0.5">{insight.detail}</p>
                </div>
              </div>
            );
          })}

          {/* Monthly projection */}
          {insights.monthProjection > 0 && (
            <div className="text-xs text-center pt-2 border-t border-(--color-border) text-(--color-text-muted)">
              Projected monthly: {formatCurrency(insights.monthProjection, insights.currency)}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <TrendingUp size={24} className="mx-auto mb-2 text-(--color-text-muted)" />
          <p className="text-xs text-(--color-text-muted)">
            Click Analyze to get AI-powered spending insights
          </p>
        </div>
      )}
    </div>
  );
}
