import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register | Personal Analytics",
  description: "Create your Personal Analytics account to start tracking your goals.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
