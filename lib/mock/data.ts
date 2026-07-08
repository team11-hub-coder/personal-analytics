import type { Transaction, Workout, Task, Reminder, Budget } from "@/types";

export const mockBudgets: Budget[] = [
  { id: 1, user_id: "1", category: "food", monthly_limit: 500, month: "2026-07" },
  { id: 2, user_id: "1", category: "transport", monthly_limit: 200, month: "2026-07" },
  { id: 3, user_id: "1", category: "bills", monthly_limit: 400, month: "2026-07" },
  { id: 4, user_id: "1", category: "entertainment", monthly_limit: 150, month: "2026-07" },
  { id: 5, user_id: "1", category: "shopping", monthly_limit: 300, month: "2026-07" },
  { id: 6, user_id: "1", category: "health", monthly_limit: 100, month: "2026-07" },
];

export const mockTransactions: Transaction[] = [
  { id: 1, user_id: "1", type: "expense", amount: 45.99, category: "food", description: "Grocery shopping", date: "2026-07-08", created_at: "2026-07-08T10:00:00Z" },
  { id: 2, user_id: "1", type: "expense", amount: 12.50, category: "transport", description: "Uber ride", date: "2026-07-08", created_at: "2026-07-08T09:00:00Z" },
  { id: 3, user_id: "1", type: "income", amount: 3200, category: "salary", description: "Monthly salary", date: "2026-07-01", created_at: "2026-07-01T00:00:00Z" },
  { id: 4, user_id: "1", type: "expense", amount: 89.99, category: "bills", description: "Internet bill", date: "2026-07-05", created_at: "2026-07-05T12:00:00Z" },
  { id: 5, user_id: "1", type: "expense", amount: 25.00, category: "entertainment", description: "Movie tickets", date: "2026-07-06", created_at: "2026-07-06T19:00:00Z" },
  { id: 6, user_id: "1", type: "expense", amount: 156.00, category: "shopping", description: "New shoes", date: "2026-07-03", created_at: "2026-07-03T14:00:00Z" },
  { id: 7, user_id: "1", type: "expense", amount: 32.50, category: "food", description: "Restaurant dinner", date: "2026-07-07", created_at: "2026-07-07T20:00:00Z" },
  { id: 8, user_id: "1", type: "expense", amount: 15.00, category: "health", description: "Pharmacy", date: "2026-07-04", created_at: "2026-07-04T11:00:00Z" },
  { id: 9, user_id: "1", type: "income", amount: 150, category: "freelance", description: "Side project", date: "2026-07-02", created_at: "2026-07-02T16:00:00Z" },
  { id: 10, user_id: "1", type: "expense", amount: 67.80, category: "food", description: "Weekly groceries", date: "2026-07-02", created_at: "2026-07-02T10:00:00Z" },
];

export const mockWorkouts: Workout[] = [
  { id: 1, user_id: "1", exercise_type: "strength", exercise_name: "Bench Press", sets: 4, reps: 10, weight: 80, duration_min: null, distance_km: null, calories: 250, notes: "Personal best!", date: "2026-07-08", created_at: "2026-07-08T07:00:00Z" },
  { id: 2, user_id: "1", exercise_type: "cardio", exercise_name: "Running", sets: null, reps: null, weight: null, duration_min: 45, distance_km: 7.2, calories: 420, notes: "Morning run", date: "2026-07-07", created_at: "2026-07-07T06:00:00Z" },
  { id: 3, user_id: "1", exercise_type: "strength", exercise_name: "Squats", sets: 4, reps: 8, weight: 100, duration_min: null, distance_km: null, calories: 300, notes: "", date: "2026-07-06", created_at: "2026-07-06T07:00:00Z" },
  { id: 4, user_id: "1", exercise_type: "flexibility", exercise_name: "Yoga Flow", sets: null, reps: null, weight: null, duration_min: 30, distance_km: null, calories: 150, notes: "Relaxing session", date: "2026-07-05", created_at: "2026-07-05T18:00:00Z" },
  { id: 5, user_id: "1", exercise_type: "cardio", exercise_name: "Cycling", sets: null, reps: null, weight: null, duration_min: 60, distance_km: 20, calories: 500, notes: "Outdoor ride", date: "2026-07-04", created_at: "2026-07-04T08:00:00Z" },
  { id: 6, user_id: "1", exercise_type: "strength", exercise_name: "Deadlift", sets: 3, reps: 5, weight: 120, duration_min: null, distance_km: null, calories: 280, notes: "", date: "2026-07-03", created_at: "2026-07-03T07:00:00Z" },
];

export const mockTasks: Task[] = [
  { id: 1, user_id: "1", title: "Review PR #42", description: "Code review for dashboard feature", priority: "high", status: "pending", due_date: "2026-07-09", completed_at: null, created_at: "2026-07-08T09:00:00Z" },
  { id: 2, user_id: "1", title: "Buy groceries", description: "", priority: "medium", status: "completed", due_date: "2026-07-08", completed_at: "2026-07-08T14:00:00Z", created_at: "2026-07-08T08:00:00Z" },
  { id: 3, user_id: "1", title: "Update resume", description: "", priority: "low", status: "pending", due_date: "2026-07-15", completed_at: null, created_at: "2026-07-07T10:00:00Z" },
  { id: 4, user_id: "1", title: "Call dentist", description: "Schedule checkup", priority: "medium", status: "pending", due_date: "2026-07-10", completed_at: null, created_at: "2026-07-07T11:00:00Z" },
];

export const mockReminders: Reminder[] = [
  { id: 1, user_id: "1", title: "Take medication", remind_at: "2026-07-09T08:00:00Z", repeat: "daily", is_active: true, created_at: "2026-07-01T00:00:00Z" },
  { id: 2, user_id: "1", title: "Weekly review", remind_at: "2026-07-13T10:00:00Z", repeat: "weekly", is_active: true, created_at: "2026-07-01T00:00:00Z" },
  { id: 3, user_id: "1", title: "Pay credit card", remind_at: "2026-07-15T09:00:00Z", repeat: "monthly", is_active: true, created_at: "2026-07-01T00:00:00Z" },
  { id: 4, user_id: "1", title: "Gym session", remind_at: "2026-07-09T07:00:00Z", repeat: "none", is_active: true, created_at: "2026-07-08T00:00:00Z" },
];

// Computed helpers for dashboard
export const getTodaySpent = () =>
  mockTransactions
    .filter((t) => t.type === "expense" && t.date === "2026-07-08")
    .reduce((sum, t) => sum + t.amount, 0);

export const getTodayWorkouts = () =>
  mockWorkouts.filter((w) => w.date === "2026-07-08").length;

export const getPendingTasks = () =>
  mockTasks.filter((t) => t.status === "pending").length;

export const getUpcomingReminders = () => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return mockReminders
    .filter((r) => {
      const d = new Date(r.remind_at);
      return r.is_active && d >= now && d <= nextWeek;
    })
    .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
    .slice(0, 5);
};

export const getCategoryData = () => {
  const catMap: Record<string, number> = {};
  mockTransactions
    .filter((t) => t.type === "expense" && t.date.startsWith("2026-07"))
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
  return Object.entries(catMap).map(([name, value]) => ({ name, value }));
};

export const getWeeklySpending = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => {
    const dateStr = `2026-07-${String(i + 1).padStart(2, "0")}`;
    const spent = mockTransactions
      .filter((t) => t.type === "expense" && t.date === dateStr)
      .reduce((sum, t) => sum + t.amount, 0);
    return { day, amount: spent };
  });
};

export const getWeeklyWorkouts = () => {
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  return weeks.map((week, i) => ({
    week,
    count: i === 0 ? 4 : i === 1 ? 3 : i === 2 ? 5 : 2,
  }));
};

export const getWorkoutProgress = () => {
  return mockWorkouts
    .filter((w) => w.exercise_name === "Bench Press" && w.weight)
    .map((w) => ({
      date: w.date,
      weight: w.weight!,
    }))
    .reverse();
};

export const getBudgetProgress = () => {
  return mockBudgets.map((b) => {
    const spent = mockTransactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category === b.category &&
          t.date.startsWith("2026-07")
      )
      .reduce((s, t) => s + t.amount, 0);
    const percent = Math.round((spent / b.monthly_limit) * 100);
    return { ...b, spent, percent };
  });
};
