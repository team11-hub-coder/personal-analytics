import type { Metadata } from "next";
import ExportClient from "./ExportClient";

export const metadata: Metadata = {
  title: "Export | Personal Analytics",
  description: "Export your data in CSV or JSON format for backup or analysis.",
};

export default function ExportPage() {
  return <ExportClient />;
}
