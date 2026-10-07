"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { DashboardSidebar } from "@/shared/components/layout/sidebar";
import { DashboardTopbar } from "@/shared/components/layout/topbar";
import { MobileDrawer } from "@/shared/components/layout/MobileDrawer";
import { BottomNav } from "@/shared/components/layout/BottomNav";
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

interface DashboardShellProps {
  role: Role;
  userName: string;
  permissions?: string[];
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userName,
  permissions = [],
  children,
}: DashboardShellProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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

  const userNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Meals", href: "/meals", icon: UtensilsCrossed },
    { name: "My Bill & Dues", href: "/bills", icon: FileSpreadsheet },
    { name: "My Payments", href: "/payments", icon: Wallet },
    { name: "My Complaints", href: "/complaints", icon: MessageSquareWarning },
    { name: "Notice Board", href: "/notices", icon: Megaphone },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar role={role} userName={userName} permissions={permissions} />
      </div>

      {/* Mobile Nav Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        role={role}
        userName={userName}
        navItems={navItems}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Topbar */}
        <DashboardTopbar
          userName={userName}
          role={role}
          onOpenDrawer={() => setIsMobileDrawerOpen(true)}
        />

        {/* Main Content Viewport */}
        <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav onOpenDrawer={() => setIsMobileDrawerOpen(true)} />
    </div>
  );
}
