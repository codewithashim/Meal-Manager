"use client";

import Link from "next/link";
import { logoutAction } from "@/server/actions/authActions";
import { LogOut, User, Bell, Menu, UtensilsCrossed } from "lucide-react";

interface TopbarProps {
  userName: string;
  role: string;
  onOpenDrawer: () => void;
}

export function DashboardTopbar({ userName, role, onOpenDrawer }: TopbarProps) {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      
      {/* Left: Mobile Hamburger & Brand Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDrawer}
          className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="lg:hidden p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              MessMate
            </h1>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Residential Mess Portal
            </span>
          </div>
        </div>
      </div>

      {/* Right: Notifications & User Account */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Notification Link */}
        <Link
          href="/notifications"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </Link>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* User Pill & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium max-w-[80px] sm:max-w-[120px] truncate">{userName}</span>
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 uppercase font-mono">
              {role}
            </span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>

        </div>

      </div>
    </header>
  );
}
