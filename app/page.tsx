import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Personal Analytics",
  description: "Your personal analytics hub for tracking finance, workouts, tasks, and more.",
};

export default function Home() {
  redirect("/dashboard");
}
