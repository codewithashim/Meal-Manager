import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { Toaster } from "sonner";
import { db } from "@/lib/db";

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
  // Read the name fresh so profile edits show without signing in again (the session keeps the login-time name).
  const freshUser = await db.user
    .findUnique({ where: { id: session.user.id }, select: { name: true } })
    .catch(() => null);
  const userName = freshUser?.name || session.user.name || "Member";
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
