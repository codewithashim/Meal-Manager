"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  BedDouble,
  UtensilsCrossed,
  Receipt,
  Wallet,
  FileSpreadsheet,
  MessageSquareWarning,
  Bell,
  Megaphone,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

interface SidebarProps {
  role: Role;
  userName: string;
  permissions?: string[];
}

export function DashboardSidebar({ role, userName, permissions = [] }: SidebarProps) {
  const pathname = usePathname();

  const adminNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/users", icon: Users },
    { name: "Access & Audit Logs", href: "/audit-logs", icon: KeyRound },
    { name: "Rooms & Seats", href: "/rooms", icon: BedDouble },
    { name: "Meal Ledger", href: "/meals", icon: UtensilsCrossed },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Payments", href: "/payments", icon: Wallet },
    { name: "Monthly Bills", href: "/bills", icon: FileSpreadsheet },
    { name: "Complaints", href: "/complaints", icon: MessageSquareWarning },
    { name: "Notices", href: "/notices", icon: Megaphone },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  const managerNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/users", icon: Users },
    { name: "Rooms & Seats", href: "/rooms", icon: BedDouble },
    { name: "Meal Ledger", href: "/meals", icon: UtensilsCrossed },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Payments", href: "/payments", icon: Wallet },
    { name: "Monthly Bills", href: "/bills", icon: FileSpreadsheet },
    { name: "Complaints", href: "/complaints", icon: MessageSquareWarning },
    { name: "Notices", href: "/notices", icon: Megaphone },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  // Base member nav
  const userNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Meals", href: "/meals", icon: UtensilsCrossed },
    { name: "My Bill & Dues", href: "/bills", icon: FileSpreadsheet },
    { name: "My Payments", href: "/payments", icon: Wallet },
    { name: "My Complaints", href: "/complaints", icon: MessageSquareWarning },
    { name: "Notice Board", href: "/notices", icon: Megaphone },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  // Dynamically grant additional nav items if explicit permissions were assigned by Admin
  if (role === Role.USER && permissions.length > 0) {
    if (permissions.includes("EXPENSES") && !userNav.some((i) => i.href === "/expenses")) {
      userNav.push({ name: "Expenses", href: "/expenses", icon: Receipt });
    }
    if (permissions.includes("ROOMS") && !userNav.some((i) => i.href === "/rooms")) {
      userNav.push({ name: "Rooms & Seats", href: "/rooms", icon: BedDouble });
    }
    if (permissions.includes("USERS") && !userNav.some((i) => i.href === "/users")) {
      userNav.push({ name: "Members", href: "/users", icon: Users });
    }
    if (permissions.includes("AUDIT_LOGS") && !userNav.some((i) => i.href === "/audit-logs")) {
      userNav.push({ name: "Audit Logs", href: "/audit-logs", icon: ShieldCheck });
    }
  }

  const navItems =
    role === Role.ADMIN
      ? adminNav
      : role === Role.MANAGER
      ? managerNav
      : userNav;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 flex flex-col justify-between p-4 shrink-0">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-100 text-lg leading-tight">MessMate</h2>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{role} Portal</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info Card */}
      <div className="pt-4 border-t border-slate-800">
        <div className="px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
            <span className="text-[10px] text-emerald-400 font-mono block uppercase">{role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
