"use client";

import { useTasks } from "@/hooks/useTasks";
import { statCard, statColors } from "@/lib/theme";
import { CheckSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TaskAnalytics() {
  const { data: allTasks, isLoading } = useTasks();
  const { data: pendingTasks } = useTasks({ status: "pending" });
  const { data: completedTasks } = useTasks({ status: "completed" });
  const { data: overdueTasks } = useTasks({ status: "overdue" });

  // Calculate completion rate
  const totalTasks = allTasks?.length || 0;
  const completedCount = completedTasks?.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const statCards = [
    {
      icon: <CheckSquare size={20} />,
      label: "Total Tasks",
      value: totalTasks.toString(),
      color: statColors.blue,
    },
    {
      icon: <Clock size={20} />,
      label: "Pending",
      value: (pendingTasks?.length || 0).toString(),
      color: statColors.amber,
    },
    {
      icon: <CheckCircle size={20} />,
      label: "Completed",
      value: `${completedCount} (${completionRate}%)`,
      color: statColors.emerald,
    },
    {
      icon: <AlertCircle size={20} />,
      label: "Overdue",
      value: (overdueTasks?.length || 0).toString(),
      color: statColors.rose,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card) => (
        <div key={card.label} className={statCard.container}>
          <div className="flex items-center gap-3">
            <div className={`${statCard.iconWrapper} ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className={statCard.label}>{card.label}</p>
              <p className={statCard.value}>{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
