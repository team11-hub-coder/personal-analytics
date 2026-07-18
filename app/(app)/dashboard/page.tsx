import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Personal Analytics",
  description: "View your daily, weekly, and monthly analytics overview including spending, workouts, tasks, and focus time.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
