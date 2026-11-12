import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDailyMeals, getMonthlyMealSummary } from "@/server/actions/mealActions";
import { getMessDateStr, getMessMonthStr, resolveMonthParam } from "@/lib/month";
import MealClientPage from "@/features/meals/components/MealClientPage";

export const metadata = {
  title: "Meal Ledger | Meal Manager",
  description: "Track daily meals, monthly totals, and meal rate calculations.",
};

export default async function MealsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { month } = await searchParams;
  const todayStr = getMessDateStr();
  const currentMonthStr = resolveMonthParam(month, getMessMonthStr());

  const dailyData = await getDailyMeals(todayStr);
  const monthlyData = session.user.role === "USER" ? null : await getMonthlyMealSummary(currentMonthStr);

  return (
    <MealClientPage
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      initialDailyData={dailyData}
      initialMonthlyData={monthlyData}
      initialDate={todayStr}
      initialMonth={currentMonthStr}
    />
  );
}
