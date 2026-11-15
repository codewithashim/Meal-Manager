import ProfileRoute from "@/features/profile/components/ProfileRoute";

export const metadata = {
  title: "My Profile | Meal Manager",
  description: "Your meals, bazaar, payments and bills for each month.",
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  return <ProfileRoute month={month} />;
}
