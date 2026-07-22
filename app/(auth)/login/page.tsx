import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | Personal Analytics",
  description: "Sign in to your Personal Analytics account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
