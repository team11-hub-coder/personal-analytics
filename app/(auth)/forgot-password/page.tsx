import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | Personal Analytics",
  description: "Reset your password to regain access to your account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
