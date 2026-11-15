import type { Metadata } from "next";
import { auth } from "@/auth";
import { LandingPage } from "@/features/landing/components/LandingPage";

export const metadata: Metadata = {
  title: "Meal Manager | Meals, bazaar and bills for your mess",
  description:
    "Log daily meals, record the bazaar, and give every mess member an itemized monthly bill. The meal rate is worked out from your own bazaar and meals.",
  openGraph: {
    title: "Meal Manager",
    description: "Every meal counted, every taka explained. Meals, bazaar and monthly bills for a bachelor mess.",
    type: "website",
  },
};

export default async function HomePage() {
  // Signed-in members can come back to the home page; its links then lead to the dashboard instead of sign-in.
  const session = await auth();
  return <LandingPage isSignedIn={!!session?.user} userName={session?.user?.name ?? undefined} />;
}
