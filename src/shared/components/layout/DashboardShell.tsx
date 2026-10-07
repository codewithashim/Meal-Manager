"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { DashboardSidebar } from "@/shared/components/layout/sidebar";
import { DashboardTopbar } from "@/shared/components/layout/topbar";
import { MobileDrawer } from "@/shared/components/layout/MobileDrawer";
import { BottomNav } from "@/shared/components/layout/BottomNav";
import { hasPermission, Resource } from "@/lib/permissions";
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
  KeyRound,
} from "lucide-react";

interface DashboardShellProps {
  role: Role;
  userName: string;
  permissions?: string[];
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  resource?: Resource;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { name: "Overview Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Daily Meals & Log", href: "/meals", icon: UtensilsCrossed, resource: "MEALS" },
  { name: "Bazaar & Mess Expenses", href: "/expenses", icon: Receipt, resource: "EXPENSES" },
  { name: "Monthly Bills & Invoices", href: "/bills", icon: FileSpreadsheet, resource: "BILLS" },
  { name: "Payment Collections", href: "/payments", icon: Wallet, resource: "PAYMENTS" },
  { name: "Mess Members Directory", href: "/users", icon: Users, resource: "USERS" },
  { name: "Rooms & Seat Allocations", href: "/rooms", icon: BedDouble, resource: "ROOMS" },
  { name: "Service Desk & Complaints", href: "/complaints", icon: MessageSquareWarning, resource: "COMPLAINTS" },
  { name: "Notice Board", href: "/notices", icon: Megaphone, resource: "NOTICES" },
  { name: "Security & Audit Logs", href: "/audit-logs", icon: KeyRound, resource: "AUDIT_LOGS" },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

export function DashboardShell({
  role,
  userName,
  permissions = [],
  children,
}: DashboardShellProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Single permission-filtered navbar
  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.resource) return true;
    return hasPermission(role, item.resource, "READ", permissions);
  });

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
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">
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
