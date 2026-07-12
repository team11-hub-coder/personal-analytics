"use client";

import { useState } from "react";
import { card, sectionHeader } from "@/lib/theme";
import { Dumbbell, Footprints, Waves, Trophy, Heart, Armchair, ChevronRight } from "lucide-react";

export interface ExerciseCategory {
  id: string;
  name: string;
  icon: typeof Dumbbell;
  color: string;
  subcategories: { name: string; muscle?: string }[];
}

export const exerciseCategories: ExerciseCategory[] = [
  {
    id: "gym",
    name: "Gym",
    icon: Dumbbell,
    color: "#8b6914",
    subcategories: [
      { name: "Bench Press", muscle: "chest" },
      { name: "Squat", muscle: "legs" },
      { name: "Deadlift", muscle: "back" },
      { name: "Overhead Press", muscle: "shoulders" },
      { name: "Barbell Row", muscle: "back" },
      { name: "Pull-ups", muscle: "back" },
      { name: "Lat Pulldown", muscle: "back" },
      { name: "Leg Press", muscle: "legs" },
      { name: "Leg Curl", muscle: "legs" },
      { name: "Leg Extension", muscle: "legs" },
      { name: "Calf Raises", muscle: "legs" },
      { name: "Bicep Curls", muscle: "arms" },
      { name: "Tricep Extensions", muscle: "arms" },
      { name: "Lateral Raise", muscle: "shoulders" },
      { name: "Cable Fly", muscle: "chest" },
    ],
  },
  {
    id: "running",
    name: "Running",
    icon: Footprints,
    color: "#ef4444",
    subcategories: [
      { name: "Treadmill" },
      { name: "Outdoor Run" },
      { name: "Interval Sprints" },
      { name: "Hill Running" },
      { name: "Trail Running" },
      { name: "5K Run" },
      { name: "10K Run" },
      { name: "Marathon Training" },
    ],
  },
  {
    id: "walking",
    name: "Walking",
    icon: Footprints,
    color: "#10b981",
    subcategories: [
      { name: "Casual Walk" },
      { name: "Brisk Walk" },
      { name: "Nordic Walking" },
      { name: "Treadmill Walk" },
      { name: "Hiking" },
      { name: "Power Walking" },
    ],
  },
  {
    id: "swimming",
    name: "Swimming",
    icon: Waves,
    color: "#3b82f6",
    subcategories: [
      { name: "Freestyle" },
      { name: "Backstroke" },
      { name: "Breaststroke" },
      { name: "Butterfly" },
      { name: "Mixed Stroke" },
      { name: "Water Aerobics" },
      { name: "Open Water Swim" },
    ],
  },
  {
    id: "sports",
    name: "Sports",
    icon: Trophy,
    color: "#f59e0b",
    subcategories: [
      { name: "Football" },
      { name: "Basketball" },
      { name: "Badminton" },
      { name: "Tennis" },
      { name: "Volleyball" },
      { name: "Table Tennis" },
      { name: "Cricket" },
      { name: "Baseball" },
      { name: "Rugby" },
      { name: "Hockey" },
    ],
  },
  {
    id: "yoga",
    name: "Yoga & Flexibility",
    icon: Heart,
    color: "#c084fc",
    subcategories: [
      { name: "Vinyasa Flow" },
      { name: "Hatha Yoga" },
      { name: "Power Yoga" },
      { name: "Yin Yoga" },
      { name: "Stretching" },
      { name: "Pilates" },
      { name: "Mobility Work" },
    ],
  },
  {
    id: "home",
    name: "Home Workout",
    icon: Armchair,
    color: "#06b6d4",
    subcategories: [
      { name: "Push-ups" },
      { name: "Sit-ups" },
      { name: "Burpees" },
      { name: "Jumping Jacks" },
      { name: "Mountain Climbers" },
      { name: "Plank" },
      { name: "Lunges" },
      { name: "Squats" },
      { name: "Dips" },
      { name: "Jump Rope" },
    ],
  },
];

interface ExerciseCategoriesProps {
  onSelect: (exercise: string, category: string) => void;
  filterIds?: string[];
  filterExercises?: string[];
}

export default function ExerciseCategories({ onSelect, filterIds, filterExercises }: ExerciseCategoriesProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  let categories = filterIds ? exerciseCategories.filter((c) => filterIds.includes(c.id)) : exerciseCategories;
  if (filterExercises) {
    categories = categories.map((cat) => ({
      ...cat,
      subcategories: cat.subcategories.filter((sub) =>
        filterExercises.some((f) => sub.name.toLowerCase().includes(f.toLowerCase()))
      ),
    })).filter((cat) => cat.subcategories.length > 0);
  }

  return (
    <div className={card.base}>
      <h3 className={sectionHeader.title + " mb-4"}>Exercise Categories</h3>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id}>
            {/* Category header */}
            <button
              onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors"
              style={{
                backgroundColor: expandedCategory === cat.id ? `${cat.color}15` : "var(--color-surface-hover)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <cat.icon size={18} style={{ color: cat.color }} />
              </div>
              <span className="flex-1 text-left text-sm font-medium" style={{ color: "var(--color-text)" }}>
                {cat.name}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {cat.subcategories.length}
              </span>
              <ChevronRight
                size={16}
                style={{
                  color: "var(--color-text-muted)",
                  transform: expandedCategory === cat.id ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {/* Subcategories */}
            {expandedCategory === cat.id && (
              <div className="ml-4 mt-2 grid grid-cols-2 gap-2">
                {cat.subcategories.map((sub) => (
                  <button
                    key={sub.name}
                    onClick={() => onSelect(sub.name, cat.name)}
                    className="p-2 rounded-lg text-left text-xs transition-colors"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <p className="font-medium" style={{ color: "var(--color-text)" }}>{sub.name}</p>
                    {sub.muscle && (
                      <p className="mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub.muscle}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
