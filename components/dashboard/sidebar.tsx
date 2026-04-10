"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
  ChevronUp,
  Zap,
  X,
} from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/dashboard", label: "Clusters", icon: LayoutDashboard },
  { href: "/alerts",    label: "Alerts",   icon: Bell            },
  { href: "/settings",  label: "Settings", icon: Settings        },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  plan?: "FREE_TRIAL" | "STARTER" | "PRO" | "SCALE" | null;
  trialDaysLeft?: number;
  firingAlertsCount?: number;
  // Mobile
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, plan, trialDaysLeft, firingAlertsCount = 0, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleNavClick() {
    onClose?.();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col border-r border-border/60 bg-sidebar h-screen shrink-0",
        "transform transition-transform duration-200 ease-in-out",
        "md:static md:translate-x-0 md:w-[220px] md:z-auto md:transition-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border/60 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 flex-1 hover:opacity-80 transition-opacity">
            <Image src="/favicon.svg" alt="OpenSearch Doctor" width={28} height={28} className="shrink-0" />
            <span className="font-bold text-sm tracking-tight">OpenSearch Doctor</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {/* Close button — mobile only */}
            <button
              onClick={onClose}
              className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
            Navigation
          </p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "")} />
                {label}
                {href === "/alerts" && firingAlertsCount > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {firingAlertsCount > 99 ? "99+" : firingAlertsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="px-3 pb-4 border-t border-border/60 pt-3 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left group">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">{user.name ?? "User"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {plan === "SCALE" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 uppercase tracking-wide leading-none">
                      <Zap className="w-2.5 h-2.5" /> Scale
                    </span>
                  ) : plan === "PRO" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 uppercase tracking-wide leading-none">
                      <Zap className="w-2.5 h-2.5" /> Pro
                    </span>
                  ) : plan === "STARTER" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 uppercase tracking-wide leading-none">
                      <Zap className="w-2.5 h-2.5" /> Starter
                    </span>
                  ) : plan === "FREE_TRIAL" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 uppercase tracking-wide leading-none">
                      Trial{typeof trialDaysLeft === "number" && trialDaysLeft > 0 ? ` · ${trialDaysLeft}d` : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide leading-none border border-border/60">
                      Free
                    </span>
                  )}
                </div>
              </div>
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-data-[state=open]:rotate-180 transition-transform" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52 mb-1">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium">{user.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => { router.push("/settings"); onClose?.(); }}
              >
                <Settings className="w-4 h-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
