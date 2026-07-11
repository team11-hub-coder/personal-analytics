"use client";

import { useMemo } from "react";
import { useTransactions } from "./useExpenses";
import { useBudgets } from "./useBudgets";
import { useProfile } from "./useProfile";

interface CategorySpend {
  category_id: number;
  category_name: string;
  category_icon: string;
  total: number;
  percentage: number;
}

interface BudgetVsActual {
  category_id: number;
  category_name: string;
  category_icon: string;
  budget_limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  is_over_budget: boolean;
}

interface MonthlySummary {
  month: string;
  total_income: number;
  total_expenses: number;
  net: number;
}

export function useExpenseAnalysis(month?: string) {
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets();
  const { data: profile } = useProfile();

  const currency = profile?.currency || "MMK";
  const isLoading = transactionsLoading || budgetsLoading;

  // Current month if not specified
  const targetMonth = month || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  // Filter transactions for target month
  const monthlyTransactions = useMemo(
    () => transactions?.filter((t) => t.date.startsWith(targetMonth)) || [],
    [transactions, targetMonth]
  );

  // Total expenses for the month
  const totalExpenses = useMemo(
    () => monthlyTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [monthlyTransactions]
  );

  // Spend by category
  const spendByCategory: CategorySpend[] = useMemo(() => {
    const grouped = monthlyTransactions.reduce(
      (acc, t) => {
        const catId = t.category_id || 0;
        const catName = t.categories?.name || "Uncategorized";
        const catIcon = t.categories?.icon || "MoreHorizontal";

        if (!acc[catId]) {
          acc[catId] = {
            category_id: catId,
            category_name: catName,
            category_icon: catIcon,
            total: 0,
          };
        }
        acc[catId].total += Number(t.amount);
        return acc;
      },
      {} as Record<number, Omit<CategorySpend, "percentage">>
    );

    // Calculate percentages
    const result = Object.values(grouped).map((item) => ({
      ...item,
      percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0,
    }));

    // Sort by total descending
    return result.sort((a, b) => b.total - a.total);
  }, [monthlyTransactions, totalExpenses]);

  // Budget vs Actual comparison
  const budgetVsActual: BudgetVsActual[] = useMemo(() => {
    if (!budgets) return [];

    return budgets.map((budget) => {
      const spent = monthlyTransactions
        .filter((t) => t.category_id === budget.category_id)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const limit = Number(budget.monthly_limit);
      const remaining = limit - spent;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        category_id: budget.category_id,
        category_name: budget.categories?.name || "Unknown",
        category_icon: budget.categories?.icon || "MoreHorizontal",
        budget_limit: limit,
        spent,
        remaining,
        percentage: Math.min(percentage, 100),
        is_over_budget: spent > limit,
      };
    });
  }, [budgets, monthlyTransactions]);

  // Total budget for the month
  const totalBudget = useMemo(
    () => budgets?.reduce((sum, b) => sum + Number(b.monthly_limit), 0) || 0,
    [budgets]
  );

  // Overall budget usage
  const budgetUsage = useMemo(
    () => (totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0),
    [totalExpenses, totalBudget]
  );

  // Daily average spending
  const dailyAverage = useMemo(() => {
    const daysInMonth = new Date(
      parseInt(targetMonth.split("-")[0]),
      parseInt(targetMonth.split("-")[1]),
      0
    ).getDate();
    const daysPassed = Math.min(
      new Date().getDate(),
      daysInMonth
    );
    return daysPassed > 0 ? totalExpenses / daysPassed : 0;
  }, [totalExpenses, targetMonth]);

  // Projected end of month spending
  const projectedTotal = useMemo(() => {
    const daysInMonth = new Date(
      parseInt(targetMonth.split("-")[0]),
      parseInt(targetMonth.split("-")[1]),
      0
    ).getDate();
    return dailyAverage * daysInMonth;
  }, [dailyAverage, targetMonth]);

  // Top spending category
  const topCategory = useMemo(
    () => spendByCategory[0] || null,
    [spendByCategory]
  );

  // Categories over budget
  const overBudgetCategories = useMemo(
    () => budgetVsActual.filter((b) => b.is_over_budget),
    [budgetVsActual]
  );

  return {
    isLoading,
    currency,
    month: targetMonth,
    // Summary
    totalExpenses,
    totalBudget,
    budgetUsage,
    // Category breakdown
    spendByCategory,
    // Budget comparison
    budgetVsActual,
    // Projections
    dailyAverage,
    projectedTotal,
    // Insights
    topCategory,
    overBudgetCategories,
    // Transaction count
    transactionCount: monthlyTransactions.length,
  };
}

// Hook for comparing multiple months
export function useMonthlyComparison(months: number = 6) {
  const { data: transactions, isLoading } = useTransactions();

  const monthlyData: MonthlySummary[] = useMemo(() => {
    if (!transactions) return [];

    const now = new Date();
    const result: MonthlySummary[] = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const monthTransactions = transactions.filter((t) =>
        t.date.startsWith(monthStr)
      );

      const totalExpenses = monthTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      result.push({
        month: monthStr,
        total_income: 0, // Not tracked in this version
        total_expenses: totalExpenses,
        net: -totalExpenses,
      });
    }

    return result.reverse(); // Oldest first
  }, [transactions, months]);

  return {
    isLoading,
    monthlyData,
  };
}
