import React from "react";
import {
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  Gamepad2,
  Heart,
  BookOpen,
  MoreHorizontal,
  Coffee,
  Home,
  Wifi,
  Phone,
  Shirt,
  Gift,
  Briefcase,
  Dumbbell,
  Music,
  Plane,
  Stethoscope,
  GraduationCap,
  Baby,
  PawPrint,
  Smile,
  type LucideIcon,
} from "lucide-react";

// Available icons for categories
export const categoryIcons: { name: string; icon: LucideIcon; color: string }[] = [
  { name: "Utensils", icon: Utensils, color: "bg-orange-50 text-orange-500" },
  { name: "Car", icon: Car, color: "bg-blue-50 text-blue-500" },
  { name: "Zap", icon: Zap, color: "bg-yellow-50 text-yellow-500" },
  { name: "ShoppingBag", icon: ShoppingBag, color: "bg-pink-50 text-pink-500" },
  { name: "Gamepad2", icon: Gamepad2, color: "bg-purple-50 text-purple-500" },
  { name: "Heart", icon: Heart, color: "bg-red-50 text-red-500" },
  { name: "BookOpen", icon: BookOpen, color: "bg-indigo-50 text-indigo-500" },
  { name: "MoreHorizontal", icon: MoreHorizontal, color: "bg-gray-50 text-gray-500" },
  { name: "Coffee", icon: Coffee, color: "bg-amber-50 text-amber-500" },
  { name: "Home", icon: Home, color: "bg-teal-50 text-teal-500" },
  { name: "Wifi", icon: Wifi, color: "bg-cyan-50 text-cyan-500" },
  { name: "Phone", icon: Phone, color: "bg-violet-50 text-violet-500" },
  { name: "Shirt", icon: Shirt, color: "bg-fuchsia-50 text-fuchsia-500" },
  { name: "Gift", icon: Gift, color: "bg-rose-50 text-rose-500" },
  { name: "Briefcase", icon: Briefcase, color: "bg-slate-50 text-slate-500" },
  { name: "Dumbbell", icon: Dumbbell, color: "bg-emerald-50 text-emerald-500" },
  { name: "Music", icon: Music, color: "bg-pink-50 text-pink-600" },
  { name: "Plane", icon: Plane, color: "bg-sky-50 text-sky-500" },
  { name: "Stethoscope", icon: Stethoscope, color: "bg-red-50 text-red-600" },
  { name: "GraduationCap", icon: GraduationCap, color: "bg-blue-50 text-blue-600" },
  { name: "Baby", icon: Baby, color: "bg-pink-50 text-pink-400" },
  { name: "PawPrint", icon: PawPrint, color: "bg-amber-50 text-amber-600" },
  { name: "Smile", icon: Smile, color: "bg-yellow-50 text-yellow-600" },
];

// Get icon by name
export function getCategoryIconInfo(iconName: string) {
  return (
    categoryIcons.find((i) => i.name === iconName) || {
      name: "MoreHorizontal",
      icon: MoreHorizontal,
      color: "bg-gray-50 text-gray-500",
    }
  );
}

// Get icon component by name
export function getCategoryIconComponent(iconName: string): LucideIcon {
  const found = categoryIcons.find((i) => i.name === iconName);
  return found?.icon || MoreHorizontal;
}

// Get color class by name
export function getCategoryIconColor(iconName: string): string {
  const found = categoryIcons.find((i) => i.name === iconName);
  return found?.color || "bg-gray-50 text-gray-500";
}
