import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings | Personal Analytics",
  description: "Manage your email notification preferences and account settings.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
