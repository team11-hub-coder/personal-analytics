"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProfile, useUpdateProfile, useUploadAvatar, useSignedAvatarUrl } from "@/hooks/useProfile";
import { useTransactions } from "@/hooks/useExpenses";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useTasks } from "@/hooks/useTasks";
import { useReminders } from "@/hooks/useReminders";
import { button, card, pageHeader } from "@/lib/theme";
import { User, Save, Target, Loader2, Globe, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { currencies, timezones, detectTimezone, getCurrencyFromTimezone } from "@/lib/currency";

const profileSchema = z.object({
  display_name: z.string().min(1, "Name is required"),
  daily_calorie_target: z.number().int().positive(),
  monthly_budget_goal: z.number().positive(),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const signedAvatarUrl = useSignedAvatarUrl(profile?.avatar_url);
  const avatarPath = profile?.avatar_url;
  const finalAvatarSrc =
    avatarPreview || (avatarPath && avatarPath.startsWith("http") ? avatarPath : signedAvatarUrl) || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Auto-sync currency when timezone changes
  const watchTimezone = watch("timezone");
  useEffect(() => {
    if (watchTimezone) {
      const detectedCurrency = getCurrencyFromTimezone(watchTimezone);
      setValue("currency", detectedCurrency, { shouldDirty: true });
    }
  }, [watchTimezone, setValue]);

  useEffect(() => {
    if (profile) {
      // Auto-detect only if profile has never been set (empty/null values)
      const needsDetectTimezone = !profile.timezone;
      const needsDetectCurrency = !profile.currency;

      const browserTimezone = detectTimezone();
      const browserCurrency = getCurrencyFromTimezone(browserTimezone);

      // Use detected values if profile still has default values
      const isDefaultTimezone = !profile.timezone || profile.timezone === "Asia/Yangon";
      const isDefaultCurrency = !profile.currency || profile.currency === "MMK";

      const newTimezone = isDefaultTimezone ? browserTimezone : profile.timezone;
      const newCurrency = isDefaultCurrency ? browserCurrency : profile.currency;

      // Set values and track if anything changed from database
      reset({
        display_name: profile.display_name,
        daily_calorie_target: profile.daily_calorie_target,
        monthly_budget_goal: profile.monthly_budget_goal,
        currency: newCurrency,
        timezone: newTimezone,
      });

      // If we auto-detected new values, mark form as dirty so user can save
      if (isDefaultTimezone || isDefaultCurrency) {
        setTimeout(() => {
          setValue("currency", newCurrency, { shouldDirty: true });
          setValue("timezone", newTimezone, { shouldDirty: true });
        }, 0);
      }
    }
  }, [profile, reset, setValue]);

  const watchedCurrency = watch("currency");
  const watchedTimezone = watch("timezone");

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    uploadAvatar.mutate(file);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-2xl">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className={card.base}>
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4 mt-6">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageHeader.title}>Profile & Settings</h1>
        <p className={pageHeader.subtitle}>Manage your account and targets</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Profile Card */}
        <div className={card.base}>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-[#e8dfd4] flex items-center justify-center overflow-hidden border-2 border-[var(--color-border)]">
                {finalAvatarSrc ? (
                  <img src={finalAvatarSrc} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-[#8b6914]" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {uploadAvatar.isPending ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : (
                  <Camera size={20} className="text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">
                {profile?.display_name || "User"}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {profile?.email}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                Account
              </h3>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  {...register("display_name")}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
                {errors.display_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.display_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Target
                  size={16}
                  className="text-[var(--color-text-secondary)]"
                />
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Daily Targets
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Calorie Target (kcal/day)
                  </label>
                  <input
                    type="number"
                    {...register("daily_calorie_target", {
                      valueAsNumber: true,
                    })}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Recommended: 2000-2500 kcal for active adults
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Monthly Budget Target
                  </label>
                  <input
                    type="number"
                    {...register("monthly_budget_goal", {
                      valueAsNumber: true,
                    })}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Your overall monthly spending goal
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Globe
                  size={16}
                  className="text-[var(--color-text-secondary)]"
                />
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Region Settings
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Currency
                  </label>
                  <select
                    {...register("currency")}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Current: {watchedCurrency} — {currencies.find((c) => c.code === watchedCurrency)?.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Timezone
                  </label>
                  <select
                    {...register("timezone")}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Current: {timezones.find((t) => t.value === watchedTimezone)?.label || watchedTimezone}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-6">
              <button
                type="submit"
                disabled={!isDirty || updateProfile.isPending}
                className={`flex items-center gap-2 ${button.primary} px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50`}
              >
                {updateProfile.isPending ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} />
                )}
                {saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Progress Stats */}
        <ProgressStats />
      </div>
    </div>
  );
}

function ProgressStats() {
  const { data: transactions = [] } = useTransactions();
  const { data: workoutResult } = useWorkouts(1000);
  const { data: tasks = [] } = useTasks();
  const { data: reminders = [] } = useReminders();

  const workouts = workoutResult?.data ?? [];
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const activeReminders = reminders.filter((r) => r.is_active).length;

  const stats = [
    { label: "Transactions logged", value: transactions.length.toLocaleString() },
    { label: "Workouts completed", value: workouts.length.toLocaleString() },
    { label: "Tasks done", value: completedTasks.toLocaleString() },
    { label: "Active reminders", value: activeReminders.toLocaleString() },
  ];

  return (
    <div className={card.base}>
      <h3 className="font-semibold text-[var(--color-text)] mb-4">
        Your Progress
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-[var(--color-surface-hover)] rounded-lg text-center"
          >
            <p className="text-xl font-bold text-[var(--color-text)]">
              {stat.value}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
