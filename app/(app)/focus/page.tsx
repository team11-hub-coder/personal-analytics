import type { Metadata } from "next";
import FocusClient from "./FocusClient";

export const metadata: Metadata = {
  title: "Focus Timer | Personal Analytics",
  description: "Track your focus sessions with Pomodoro timer and monitor your productivity.",
};

export default function FocusPage() {
  return <FocusClient />;
}
