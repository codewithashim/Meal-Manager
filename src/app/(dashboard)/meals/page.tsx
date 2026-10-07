import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDailyMeals, getMonthlyMealSummary } from "@/server/actions/mealActions";
import MealClientPage from "@/features/meals/components/MealClientPage";

export const metadata = {
  title: "Meal Ledger | Mess Mate",
  description: "Track daily meals, monthly totals, and mess meal rate calculations.",
};

export default async function MealsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  const dailyData = await getDailyMeals(todayStr);
  const monthlyData = await getMonthlyMealSummary(currentMonthStr);

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
