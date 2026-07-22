import type { Metadata } from "next";
import ProfileForm from "@/components/auth/ProfileForm";

export const metadata: Metadata = {
  title: "Profile | Personal Analytics",
  description: "Manage your profile, set targets, and configure your account settings.",
};

export default function ProfilePage() {
  return <ProfileForm />;
}
