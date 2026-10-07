import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const userName = session.user.name || "Member";
  const permissions = session.user.permissions || [];

  return (
    <>
      <DashboardShell role={role} userName={userName} permissions={permissions}>
        {children}
      </DashboardShell>
      <Toaster position="top-right" theme="dark" richColors />
    </>
  );
}
