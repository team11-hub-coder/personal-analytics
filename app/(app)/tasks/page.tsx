import type { Metadata } from "next";
import TasksClient from "./TasksClient";

export const metadata: Metadata = {
  title: "Tasks | Personal Analytics",
  description: "Manage your tasks, track completion rates, and stay productive.",
};

export default function TasksPage() {
  return <TasksClient />;
}
