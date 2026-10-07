"use server";

import { auth } from "@/auth";
import { ComplaintService } from "@/features/complaints/services/complaint.service";
import { NoticeService } from "@/features/notices/services/notice.service";
import { AuditService } from "@/services/audit.service";
import { NotificationService } from "@/services/notification.service";
import { Priority, ComplaintStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/* ==========================================================================
   COMPLAINTS ACTIONS
   ========================================================================== */

export async function getComplaints(
  categoryFilter?: string,
  priorityFilter?: string,
  statusFilter?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await ComplaintService.getComplaints(
    session.user.role,
    session.user.permissions,
    session.user.id,
    categoryFilter,
    priorityFilter,
    statusFilter
  );
}

export async function createComplaint(data: {
  title: string;
  category: any;
  description: string;
  priority: Priority;
}) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await ComplaintService.createComplaint(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) revalidatePath("/complaints");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateComplaintStatus(
  input: string | { id: string; status: ComplaintStatus; adminNote?: string },
  statusParam?: ComplaintStatus,
  adminNoteParam?: string
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  let id: string;
  let status: ComplaintStatus;
  let adminNote: string | undefined;

  if (typeof input === "object") {
    id = input.id;
    status = input.status;
    adminNote = input.adminNote;
  } else {
    id = input;
    status = statusParam!;
    adminNote = adminNoteParam;
  }

  try {
    const result = await ComplaintService.updateStatus(
      session.user.id,
      session.user.role,
      session.user.permissions,
      id,
      status,
      adminNote
    );
    if (result.success) revalidatePath("/complaints");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

/* ==========================================================================
   NOTICES ACTIONS
   ========================================================================== */

export async function getNotices() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await NoticeService.getNotices(
    session.user.role,
    session.user.permissions
  );
}

export async function createNotice(data: {
  title: string;
  description: string;
  priority: Priority;
}) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await NoticeService.createNotice(
      session.user.id,
      session.user.role,
      session.user.permissions,
      data
    );
    if (result.success) revalidatePath("/notices");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteNotice(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    const result = await NoticeService.deleteNotice(
      session.user.id,
      session.user.role,
      session.user.permissions,
      id
    );
    if (result.success) revalidatePath("/notices");
    return result;
  } catch (err: any) {
    return { error: err.message };
  }
}

/* ==========================================================================
   NOTIFICATIONS ACTIONS
   ========================================================================== */

export async function getUserNotifications() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await NotificationService.getUserNotifications(session.user.id);
}

export async function markNotificationAsRead(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  await NotificationService.markAsRead(id, session.user.id);
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  await NotificationService.markAllAsRead(session.user.id);
  revalidatePath("/notifications");
  return { success: true };
}

/* ==========================================================================
   AUDIT LOGS ACTIONS
   ========================================================================== */

export async function getAuditLogs() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const hasAccess =
    session.user.role === "ADMIN" ||
    (session.user.permissions && session.user.permissions.includes("AUDIT_LOGS"));

  if (!hasAccess) {
    throw new Error("Forbidden");
  }

  return await AuditService.getLogs();
}
