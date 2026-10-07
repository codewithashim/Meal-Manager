import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAuditLogs } from "@/server/actions/communicationActions";
import { getUsers } from "@/server/actions/userActions";
import { AuditLogsClientPage } from "@/features/audit/components/AuditLogsClientPage";

export const metadata = {
  title: "Access Control & Audit Logs | MessMate",
  description:
    "Configure user access control permissions and track system security audit trails.",
};

export default async function AuditLogsPage() {
  const session = await auth();

  const userRole = session?.user?.role;
  const userPermissions = session?.user?.permissions || [];
  const hasAccess = userRole === "ADMIN" || userPermissions.includes("AUDIT_LOGS");

  if (!session?.user || !hasAccess) {
    redirect("/dashboard");
  }

  const [logs, users] = await Promise.all([
    getAuditLogs().catch(() => []),
    getUsers().catch(() => []),
  ]);

  return <AuditLogsClientPage initialLogs={logs} initialUsers={users as any} />;
}
