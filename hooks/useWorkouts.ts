"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "./useAuth";
import { getWorkouts } from "@/lib/workouts";

export function useWorkouts(limit = 50) {
  const { data: user, isLoading: authLoading } = useUser();

  return useQuery({
    queryKey: ["workouts", limit, user?.id],
    queryFn: () => getWorkouts(limit),
    enabled: !authLoading && !!user,
  });
}
