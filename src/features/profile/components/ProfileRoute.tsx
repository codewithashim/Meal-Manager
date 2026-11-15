import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMessMonthStr, resolveMonthParam } from "@/lib/month";
import { ProfileService } from "@/features/profile/services/profile.service";
import ProfileClientPage from "@/features/profile/components/ProfileClientPage";

// Server loader shared by /profile (own) and /profile/[userId] (a member, for managers).
export default async function ProfileRoute({ userId, month }: { userId?: string; month?: string }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const actor = { id: session.user.id, role: session.user.role, permissions: session.user.permissions };
  const targetId = userId ?? actor.id;

  if (!/^[0-9a-f]{24}$/i.test(targetId)) notFound();
  if (!ProfileService.canView(actor, targetId)) redirect("/profile");

  const selectedMonth = resolveMonthParam(month, getMessMonthStr());
  const overview = await ProfileService.getOverview(actor, targetId, selectedMonth);
  if (!overview) notFound();

  return <ProfileClientPage initialOverview={overview} isOwnProfile={targetId === actor.id} />;
}
