import ProfileRoute from "@/features/profile/components/ProfileRoute";

export const metadata = {
  title: "Member Profile | Meal Manager",
  description: "A member's meals, bazaar, payments and bills for each month.",
};

export default async function MemberProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ userId }, { month }] = await Promise.all([params, searchParams]);
  return <ProfileRoute userId={userId} month={month} />;
}
