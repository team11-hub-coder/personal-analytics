import type { Metadata } from "next";
import RemindersClient from "./RemindersClient";

export const metadata: Metadata = {
  title: "Reminders | Personal Analytics",
  description: "Set and manage reminders for important events and tasks.",
};

export default function RemindersPage() {
  return <RemindersClient />;
}
