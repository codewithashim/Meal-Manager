"use client";

import { Role } from "@prisma/client";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardKpiCards } from "./DashboardKpiCards";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { DashboardActivityTabs } from "./DashboardActivityTabs";

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  createdBy: string;
}

interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  userName: string;
  createdAt: string;
}

interface NoticeItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  createdAt: string;
}

interface TodayUserMeal {
  userName: string;
  mealStatus: boolean;
  breakfast: number;
  lunch: number;
  dinner: number;
  totalMeals: number;
}

interface DashboardClientViewProps {
  userName: string;
  userRole: Role;
  userId: string;
  mealStatus: boolean;
  messName?: string;
  roomInfo?: string | null;
  adminKpis: {
    estimatedMealRate: number;
    totalFoodExpense: number;
    messTotalMeals: number;
    todayMealsCount: {
      breakfast: number;
      lunch: number;
      dinner: number;
      total: number;
    };
    totalExpenses: number;
    totalPayments: number;
    netBalance: number;
    occupiedSeats: number;
    totalCapacity: number;
    roomCount: number;
    activeMealUsers: number;
    userCount: number;
    pendingComplaints: number;
    unpaidBills: number;
  };
  userKpis: {
    myTotalMeals: number;
    myEstimatedCost: number;
    myCurrentBill: {
      totalBill: number;
      dueAmount: number;
      totalPaid: number;
      status: string;
      month: string;
    } | null;
    mySeatInfo: {
      roomName: string;
      floor: number;
      seatNumber: string;
    } | null;
    estimatedMealRate: number;
    myPendingComplaints: number;
  };
  recentExpenses: ExpenseItem[];
  pendingComplaints: ComplaintItem[];
  latestNotices: NoticeItem[];
  todayBoarders: TodayUserMeal[];
}

export function DashboardClientView({
  userName,
  userRole,
  userId,
  mealStatus,
  messName,
  roomInfo,
  adminKpis,
  userKpis,
  recentExpenses,
  pendingComplaints,
  latestNotices,
  todayBoarders,
}: DashboardClientViewProps) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* 1. Header & Greeting Banner */}
      <DashboardHeader
        userName={userName}
        userRole={userRole}
        userId={userId}
        mealStatus={mealStatus}
        messName={messName}
        roomInfo={roomInfo}
      />

      {/* 2. Highlight KPI Scorecards */}
      <DashboardKpiCards role={userRole} adminKpis={adminKpis} userKpis={userKpis} />

      {/* 3. Quick Action Navigation Bar */}
      <DashboardQuickActions
        role={userRole}
        pendingComplaints={adminKpis.pendingComplaints}
        unpaidBills={adminKpis.unpaidBills}
      />

      {/* 4. Tabbed Operational Feed & Activity Stream */}
      <DashboardActivityTabs
        recentExpenses={recentExpenses}
        pendingComplaints={pendingComplaints}
        latestNotices={latestNotices}
        todayBoarders={todayBoarders}
      />
    </div>
  );
}
