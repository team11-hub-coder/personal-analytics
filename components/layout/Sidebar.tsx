"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui";
import { useLogout } from "@/hooks/useAuth";
import { sidebar } from "@/lib/theme";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  DollarSign,
  Dumbbell,
  CheckSquare,
  Bell,
  Timer,
  User,
  Download,
  LogOut,
  X,
  Sun,
  Moon,
  Settings,
} from "lucide-react";

const links = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/finance", icon: DollarSign, label: "Finance" },
  { href: "/workouts", icon: Dumbbell, label: "Workouts" },
  { href: "/focus", icon: Timer, label: "Focus" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/reminders", icon: Bell, label: "Reminders" },
  { href: "/export", icon: Download, label: "Export" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-dvh w-64 flex flex-col
          transition-transform duration-300
          lg:sticky lg:top-0 lg:h-dvh lg:z-auto lg:translate-x-0 lg:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          bg-[var(--color-sidebar-bg)] text-slate-300
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Personal Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1">Life Dashboard</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto hide-scrollbar">
          {links.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`${sidebar.link} ${isActive ? sidebar.linkActive : sidebar.linkInactive}`}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 space-y-1">
          <button onClick={toggleTheme} className={sidebar.footerButton}>
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
          <Dialog>
            <DialogTrigger
              disabled={logout.isPending}
              className={sidebar.footerButton}
            >
              <LogOut size={18} />
              Logout
            </DialogTrigger>
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Confirm Logout</DialogTitle>
                <DialogDescription>
                  Are you sure you want to log out?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button onClick={() => logout.mutate()}>
                  Logout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </aside>
    </>
  );
}
