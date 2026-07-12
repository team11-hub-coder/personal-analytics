"use client";

import { useState, useMemo } from "react";
import { FileText, FileJson, Download, Calendar, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useExpenses";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useTasks } from "@/hooks/useTasks";
import { useReminders } from "@/hooks/useReminders";
import { card, pageHeader } from "@/lib/theme";

// ─── Export Helpers ──────────────────────────────────────────

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ────────────────────────────────────────────────────

export default function ExportPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [downloading, setDownloading] = useState<Record<string, "idle" | "downloading" | "success">>({});

  const handleExport = async (title: string, onExportFn: () => void) => {
    setDownloading((prev) => ({ ...prev, [title]: "downloading" }));
    
    // Simulate/play loading micro-animation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    try {
      onExportFn();
      setDownloading((prev) => ({ ...prev, [title]: "success" }));
      setTimeout(() => {
        setDownloading((prev) => ({ ...prev, [title]: "idle" }));
      }, 1500);
    } catch (err) {
      console.error(err);
      setDownloading((prev) => ({ ...prev, [title]: "idle" }));
    }
  };

  // Fetch data
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: workoutResult, isLoading: woLoading } = useWorkouts(1000);
  const { data: tasks = [], isLoading: taskLoading } = useTasks();
  const { data: reminders = [], isLoading: remLoading } = useReminders();

  const workouts = workoutResult?.data ?? [];
  const isLoading = txLoading || woLoading || taskLoading || remLoading;

  // Filter by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo]);

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      const d = w.date.split("T")[0];
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [workouts, dateFrom, dateTo]);

  // Export cards config
  const exportCards = [
    {
      icon: <FileText size={20} />,
      title: "Finance Data CSV",
      description: "Export transactions and budgets",
      color: "bg-emerald-50 text-emerald-600",
      count: filteredTransactions.length,
      onExport: () => {
        const data = filteredTransactions.map((t) => ({
          date: t.date,
          type: t.type,
          amount: t.amount,
          category: t.categories?.name ?? "Other",
          description: t.description ?? "",
        }));
        downloadCSV(data, `finance-export-${new Date().toISOString().split("T")[0]}.csv`);
      },
    },
    {
      icon: <FileText size={20} />,
      title: "Workout Data CSV",
      description: "Export workout history",
      color: "bg-[#f3ece3] text-[#8b6914]",
      count: filteredWorkouts.length,
      onExport: () => {
        const data = filteredWorkouts.map((w) => ({
          date: w.date.split("T")[0],
          exercise_name: w.exercise_name,
          exercise_type: w.exercise_type,
          sets: w.sets ?? "",
          reps: w.reps ?? "",
          weight: w.weight ?? "",
          duration_min: w.duration_min ?? "",
          calories: w.calories ?? "",
          notes: w.notes ?? "",
        }));
        downloadCSV(data, `workout-export-${new Date().toISOString().split("T")[0]}.csv`);
      },
    },
    {
      icon: <FileJson size={20} />,
      title: "All Data JSON",
      description: "Complete backup of all data",
      color: "bg-amber-50 text-amber-600",
      count: filteredTransactions.length + filteredWorkouts.length + tasks.length + reminders.length,
      onExport: () => {
        downloadJSON(
          {
            exported_at: new Date().toISOString(),
            transactions: filteredTransactions,
            workouts: filteredWorkouts,
            tasks,
            reminders,
          },
          `full-backup-${new Date().toISOString().split("T")[0]}.json`
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageHeader.title}>Data Export</h1>
        <p className={pageHeader.subtitle}>
          Export your data for backup or analysis.
        </p>
      </div>

      {/* Date Range */}
      <div className={card.base}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-[var(--color-text-secondary)]" />
          <h3 className="font-semibold text-[var(--color-text)]">Date Range</h3>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-1 block">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm dark:scheme-dark"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-1 block">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm dark:scheme-dark"
            />
          </div>
          {(dateFrom || dateTo) && (
            <div className="flex items-end">
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-(--color-surface-hover) rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className={card.base + " flex flex-col h-full justify-between"}>
                <div>
                  <Skeleton className="h-12 w-full mb-4" />
                  <Skeleton className="h-4 w-24 mb-4" />
                </div>
                <Skeleton className="h-10 w-full mt-auto" />
              </div>
            ))}
          </>
        ) : (
          exportCards.map((c) => {
            const status = downloading[c.title] || "idle";
            return (
              <div key={c.title} className={card.base + " flex flex-col h-full justify-between"}>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
                      {c.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">{c.title}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{c.description}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    {c.count} records
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={`w-full border-[var(--color-border)] gap-2 mt-auto transition-all ${
                    status === "success"
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
                      : ""
                  }`}
                  onClick={() => handleExport(c.title, c.onExport)}
                  disabled={c.count === 0 || status === "downloading"}
                >
                  {status === "downloading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Downloading...
                    </>
                  ) : status === "success" ? (
                    <>
                      <Check size={16} />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download
                    </>
                  )}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
