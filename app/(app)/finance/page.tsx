import type { Metadata } from "next";
import FinanceClient from "./FinanceClient";

export const metadata: Metadata = {
  title: "Finance | Personal Analytics",
  description: "Track your expenses, manage budgets, and monitor your financial goals.",
};

export default function FinancePage() {
  return <FinanceClient />;
}
