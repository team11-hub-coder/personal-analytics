import type { Metadata } from "next";
import WorkoutsClient from "./WorkoutsClient";

export const metadata: Metadata = {
  title: "Workouts | Personal Analytics",
  description: "Log your workouts, track exercise progress, and monitor your fitness goals.",
};

export default function WorkoutsPage() {
  return <WorkoutsClient />;
}
