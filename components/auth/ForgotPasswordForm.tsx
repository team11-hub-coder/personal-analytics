"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Check your email
          </h2>
          <p className="text-white/60 text-sm mb-6">
            We&apos;ve sent a password reset link to your email address.
          </p>
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-[#c9a96e] hover:text-[#8b6914] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
      <h2 className="text-xl font-semibold text-white mb-2">
        Reset Password
      </h2>
      <p className="text-white/50 text-sm mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 focus:border-[#c9a96e]/50 transition-all"
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#8b6914] to-[#c9a96e] text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#8b6914]/25"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Mail size={16} />
          )}
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-[#c9a96e]/70 hover:text-[#c9a96e] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
