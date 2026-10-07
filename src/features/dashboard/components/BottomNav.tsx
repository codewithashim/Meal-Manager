"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, FileSpreadsheet, Receipt, Menu } from "lucide-react";

interface BottomNavProps {
  onOpenDrawer: () => void;
}

export function BottomNav({ onOpenDrawer }: BottomNavProps) {
  const pathname = usePathname();

  const tabs = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Meals", href: "/meals", icon: UtensilsCrossed },
    { name: "Bills", href: "/bills", icon: FileSpreadsheet },
    { name: "Expenses", href: "/expenses", icon: Receipt },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around px-2 py-1.5 shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-medium transition ${
              isActive
                ? "text-emerald-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400 scale-110" : "text-slate-400"}`} />
            <span>{tab.name}</span>
          </Link>
        );
      })}

      {/* Menu Button */}
      <button
        onClick={onOpenDrawer}
        className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
      >
        <Menu className="w-5 h-5 text-slate-400" />
        <span>More</span>
      </button>
    </div>
  );
}
