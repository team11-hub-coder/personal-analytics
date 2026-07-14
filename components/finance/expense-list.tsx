"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { useProfile } from "@/hooks/useProfile";
import { card, button } from "@/lib/theme";
import { formatCurrency } from "@/lib/currency";
import { getCategoryIconInfo } from "@/lib/icons";
import {
  inlineTransactionSchema,
  type InlineTransactionFormData,
} from "@/lib/validations";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Receipt,
  X,
  Check,
  Filter,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ExpenseForm from "./expense-form";

export default function ExpenseList() {
  const { data: transactions, isLoading, error } = useTransactions();
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();
  const [isAdding, setIsAdding] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<number | undefined>();
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currency = profile?.currency || "MMK";

  // Get unique months from transactions
  const months = [
    ...new Set(transactions?.map((t) => t.date.substring(0, 7)) || []),
  ].sort().reverse();

  // Min date is year 2000
  const minDate = "2000-01-01";

  // Calculate min date for end date (must be after start date)
  const getMinEndDate = (startDate: string): string => {
    return startDate || minDate;
  };

  // Validate date range
  const dateRangeError = (() => {
    if (filterDateFrom && filterDateTo) {
      if (filterDateFrom > filterDateTo) {
        return "End date cannot be before start date";
      }
      const from = new Date(filterDateFrom);
      const to = new Date(filterDateTo);
      const diffMonths =
        (to.getFullYear() - from.getFullYear()) * 12 +
        (to.getMonth() - from.getMonth());
      if (diffMonths > 3) {
        return "Maximum range is 3 months";
      }
    }
    return null;
  })();

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((t) => {
      // Skip filtering if date range has error
      if (dateRangeError) return true;

      // Month filter
      if (filterMonth && !showAdvanced) {
        if (!t.date.startsWith(filterMonth)) return false;
      }

      // Date range filter (advanced)
      if (showAdvanced) {
        if (filterDateFrom && t.date < filterDateFrom) return false;
        if (filterDateTo && t.date > filterDateTo) return false;
      }

      // Category filter
      if (filterCategory && t.category_id !== filterCategory) return false;

      return true;
    });
  }, [
    transactions,
    dateRangeError,
    filterMonth,
    showAdvanced,
    filterDateFrom,
    filterDateTo,
    filterCategory,
  ]);

  // Calculate total for filtered transactions
  const totalFiltered = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [filteredTransactions]
  );

  const clearFilters = () => {
    setFilterMonth("");
    setFilterCategory(undefined);
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilters =
    filterCategory || (showAdvanced && (filterDateFrom || filterDateTo));

  // Error state
  if (error) {
    return (
      <div className={card.base}>
        <div className="text-center py-8">
          <AlertCircle
            size={48}
            className="mx-auto text-red-400 mb-3"
          />
          <p className="text-[var(--color-text)] font-medium">
            Failed to load transactions
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {error.message || "Please try again later"}
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={card.base}>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={card.base}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[var(--color-text)]">Transactions</h3>
        <button
          onClick={() => setIsAdding(true)}
          className={`flex items-center gap-2 ${button.primary} px-3 py-1.5 rounded-lg text-sm`}
        >
          <Plus size={14} />
          Add Expense
        </button>
      </div>

      {/* Filters - Always on top */}
      <div className="mb-4 p-3 bg-[var(--color-surface-hover)] rounded-lg">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} className="text-[var(--color-text-muted)]" />

          {!showAdvanced ? (
            // Simple mode: Month dropdown
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            // Advanced mode: Date range
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--color-text-muted)]" />
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  const newFrom = e.target.value;
                  setFilterDateFrom(newFrom);
                  // Clear end date if it's now invalid
                  if (filterDateTo && newFrom > filterDateTo) {
                    setFilterDateTo("");
                  }
                }}
                max={filterDateTo || ""}
                className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm"
                placeholder="From"
              />
              <span className="text-[var(--color-text-muted)]">to</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  const newTo = e.target.value;
                  setFilterDateTo(newTo);
                  // Clear start date if it's now invalid
                  if (filterDateFrom && filterDateFrom > newTo) {
                    setFilterDateFrom("");
                  }
                }}
                min={getMinEndDate(filterDateFrom)}
                className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm"
                placeholder="To"
              />
            </div>
          )}

          {/* Category filter */}
          <select
            value={filterCategory || ""}
            onChange={(e) =>
              setFilterCategory(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Toggle simple/advanced */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            {showAdvanced ? "Simple" : "Advanced"}
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 hover:underline"
            >
              Clear
            </button>
          )}

          {/* Total */}
          <span className="text-sm text-[var(--color-text-secondary)] ml-auto">
            Total: {formatCurrency(totalFiltered, currency)}
          </span>
        </div>

        {/* Date range error */}
        {dateRangeError && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <AlertCircle size={12} />
            {dateRangeError}
          </p>
        )}
      </div>

      {/* Add form - Below filters */}
      {isAdding && (
        <div className="mb-4">
          <ExpenseForm
            onSuccess={() => setIsAdding(false)}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      )}

      {/* Transaction list - Grouped by Date, then Category */}
      {filteredTransactions.length > 0 ? (
        <GroupedTransactions
          transactions={filteredTransactions}
          currency={currency}
        />

      ) : (
        !isAdding && (
          <div className="text-center py-8">
            <Receipt
              size={48}
              className="mx-auto text-[var(--color-text-muted)] mb-3"
            />
            <p className="text-[var(--color-text-secondary)]">
              {hasActiveFilters
                ? "No transactions match your filters"
                : "No transactions yet"}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Add your first expense to get started"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-[var(--color-primary)] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}

// Group transactions by Date, then by Category
function GroupedTransactions({
  transactions,
  currency,
}: {
  transactions: {
    id: number;
    amount: number;
    date: string;
    description: string | null;
    entry_source: string | null;
    category_id: number | null;
    categories: { id: number; name: string; icon: string } | null;
  }[];
  currency: string;
}) {
  // Group by date
  const groupedByDate = transactions.reduce(
    (acc, t) => {
      const date = t.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    },
    {} as Record<string, typeof transactions>
  );

  // Sort dates descending
  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const dayTransactions = groupedByDate[date];
        const dayTotal = dayTransactions.reduce(
          (sum, t) => sum + Number(t.amount),
          0
        );

        // Group by category within this date
        const groupedByCategory = dayTransactions.reduce(
          (acc, t) => {
            const catId = t.category_id || 0;
            const catName = t.categories?.name || "Uncategorized";
            const catIcon = t.categories?.icon || "MoreHorizontal";
            if (!acc[catId]) {
              acc[catId] = { name: catName, icon: catIcon, transactions: [], total: 0 };
            }
            acc[catId].transactions.push(t);
            acc[catId].total += Number(t.amount);
            return acc;
          },
          {} as Record<
            number,
            { name: string; icon: string; transactions: typeof transactions; total: number }
          >
        );

        return (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                {formatDateHeader(date)}
              </h4>
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {formatCurrency(dayTotal, currency)}
              </span>
            </div>

            {/* Categories within this date */}
            <div className="space-y-2 ml-2">
              {Object.entries(groupedByCategory).map(
                ([catId, { name, icon, transactions: catTransactions, total }]) => {
                  const catIconInfo = getCategoryIconInfo(icon);
                  const CatIcon = catIconInfo.icon;
                  return (
                  <div key={catId}>
                    {/* Category header */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${catIconInfo.color}`}>
                          <CatIcon size={10} />
                        </div>
                        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                          {name}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>

                    {/* Transactions in this category */}
                    <div className="space-y-1">
                      {catTransactions.map((transaction) => (
                        <ExpenseItem
                          key={transaction.id}
                          transaction={transaction}
                          currency={currency}
                        />
                      ))}
                    </div>
                  </div>
                  );
                }
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExpenseItem({
  transaction,
  currency,
}: {
  transaction: {
    id: number;
    amount: number;
    date: string;
    description: string | null;
    entry_source: string | null;
    categories: { id: number; name: string; icon: string } | null;
  };
  currency: string;
}) {
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InlineTransactionFormData>({
    resolver: zodResolver(inlineTransactionSchema),
    defaultValues: {
      amount: transaction.amount,
      description: transaction.description || "",
    },
  });

  const handleDelete = () => {
    if (confirm("Delete this transaction?")) {
      deleteTransaction.mutate(transaction.id);
    }
  };

  const onSubmit = (data: InlineTransactionFormData) => {
    updateTransaction.mutate(
      {
        id: transaction.id,
        amount: data.amount,
        description: data.description,
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  // Get icon from category's icon field in database
  const getCategoryIconDisplay = (iconName: string | null | undefined) => {
    return getCategoryIconInfo(iconName || "MoreHorizontal");
  };

  const getSourceBadge = (source: string | null) => {
    const badges: Record<string, { label: string; color: string }> = {
      manual_form: { label: "M", color: "bg-gray-100 text-gray-600" },
      chatbot_text: { label: "C", color: "bg-blue-100 text-blue-600" },
      chatbot_voice: { label: "V", color: "bg-purple-100 text-purple-600" },
      chatbot_receipt: {
        label: "R",
        color: "bg-amber-100 text-amber-600",
      },
      recurring: {
        label: "Re",
        color: "bg-emerald-100 text-emerald-600",
      },
    };
    const badge = badges[source || "manual_form"] || badges.manual_form;
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.color}`}
        title={
          source === "manual_form"
            ? "Manual"
            : source === "chatbot_text"
            ? "Chat"
            : source === "chatbot_voice"
            ? "Voice"
            : source === "chatbot_receipt"
            ? "Receipt"
            : "Recurring"
        }
      >
        {badge.label}
      </span>
    );
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-[var(--color-surface-hover)] rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                step="1"
                {...register("amount", { valueAsNumber: true })}
                className="border border-[var(--color-border)] rounded px-2 py-1 text-sm"
              />
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                {...register("description")}
                placeholder="Description"
                className="border border-[var(--color-border)] rounded px-2 py-1 text-sm"
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={updateTransaction.isPending}
              className={`${button.primary} px-3 py-1 rounded-lg text-sm`}
            >
              {updateTransaction.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`${button.ghost} px-3 py-1 rounded-lg text-sm`}
            >
              <X size={12} />
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 bg-[var(--color-surface-hover)] rounded-lg group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryIconDisplay(transaction.categories?.icon ?? null).color}`}>
          {(() => {
            const IconComp = getCategoryIconDisplay(transaction.categories?.icon ?? null).icon;
            return <IconComp size={14} />;
          })()}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {transaction.description || transaction.categories?.name || "Uncategorized"}
          </span>
          {getSourceBadge(transaction.entry_source)}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {formatCurrency(Number(transaction.amount), currency)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteTransaction.isPending}
            className="p-1 text-[var(--color-text-muted)] hover:text-red-500"
          >
            {deleteTransaction.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
