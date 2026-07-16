"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { useRegister } from "@/hooks/useAuth";
import { UserPlus, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";

export default function RegisterForm() {
  const register = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    register.mutate(data);
  };

  if (register.isSuccess) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="bg-green-500/20 border border-green-500/30 rounded-full p-4 mb-4">
            <MailCheck size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Check your email
          </h2>
          <p className="text-white/60 text-sm mb-6">
            We sent a confirmation link to your email. Click the link to verify
            your account and sign in.
          </p>
          <Link
            href="/login"
            className="text-sm text-[#c9a96e] hover:text-[#8b6914] transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
      <h2 className="text-xl font-semibold text-white mb-6">
        Create Account
      </h2>

      {register.isError && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm px-4 py-2 rounded-lg mb-4">
          {register.error instanceof Error
            ? register.error.message
            : "Registration failed"}
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
            {...registerField("email")}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 focus:border-[#c9a96e]/50 transition-all"
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...registerField("password")}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 pr-10 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 focus:border-[#c9a96e]/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 mt-1">
              {errors.password.message}
            </p>
          )}
          <p className="text-xs text-white/40 mt-1">
            Min 8 chars, 1 number, 1 special character
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...registerField("confirmPassword")}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 pr-10 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 focus:border-[#c9a96e]/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={register.isPending}
          className="w-full bg-gradient-to-r from-[#8b6914] to-[#c9a96e] text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#8b6914]/25"
        >
          {register.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UserPlus size={16} />
          )}
          {register.isPending ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm text-[#c9a96e] hover:text-[#8b6914] transition-colors"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
