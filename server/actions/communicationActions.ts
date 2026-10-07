"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { enforcePermission } from "@/lib/permissions";
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  createNoticeSchema,
  CreateComplaintInput,
  UpdateComplaintStatusInput,
  CreateNoticeInput,
} from "@/lib/validations/communication";
import { revalidatePath } from "next/cache";

/* ==========================================================================
   COMPLAINTS ACTIONS
   ========================================================================== */

export async function getComplaints(statusFilter?: string, categoryFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "COMPLAINTS", "READ");

  const where: any = {};

  // General users can only view their own complaints
  if (session.user.role === "USER") {
    where.userId = session.user.id;
  }

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  if (categoryFilter && categoryFilter !== "ALL") {
    where.category = categoryFilter;
  }

  const complaints = await db.complaint.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return complaints;
}

export async function createComplaint(data: CreateComplaintInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "COMPLAINTS", "CREATE");
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = createComplaintSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const newComplaint = await db.complaint.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: "PENDING",
    },
    include: { user: true },
  });

  // Notify Admins & Managers
  const adminsAndManagers = await db.user.findMany({
    where: { role: { in: ["ADMIN", "MANAGER"] } },
    select: { id: true },
  });

  const notifications = adminsAndManagers.map((staff) => ({
    userId: staff.id,
    title: `New Complaint: ${newComplaint.title}`,
    message: `${newComplaint.user.name} submitted a ${newComplaint.priority} priority complaint (${newComplaint.category}).`,
    type: "COMPLAINT" as const,
  }));

  if (notifications.length > 0) {
    await db.notification.createMany({ data: notifications });
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CREATE_COMPLAINT",
      entity: "Complaint",
      entityId: newComplaint.id,
      details: `Submitted complaint "${newComplaint.title}" (${newComplaint.priority})`,
    },
  });

  revalidatePath("/complaints");
  return { success: true, complaint: newComplaint };
}

export async function updateComplaintStatus(data: UpdateComplaintStatusInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "COMPLAINTS", "UPDATE");
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = updateComplaintStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { id, status, adminNote } = parsed.data;

  const complaint = await db.complaint.findUnique({ where: { id } });
  if (!complaint) return { error: "Complaint not found." };

  const updated = await db.complaint.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote || null,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
    },
  });

  // Send notification to member
  await db.notification.create({
    data: {
      userId: complaint.userId,
      title: `Complaint Status Updated: ${status}`,
      message: `Your complaint "${complaint.title}" has been marked as ${status}.${
        adminNote ? ` Manager note: ${adminNote}` : ""
      }`,
      type: "COMPLAINT",
    },
  });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "UPDATE_COMPLAINT_STATUS",
      entity: "Complaint",
      entityId: id,
      details: `Updated complaint "${complaint.title}" status to ${status}`,
    },
  });

  revalidatePath("/complaints");
  return { success: true, complaint: updated };
}

/* ==========================================================================
   NOTICES ACTIONS
   ========================================================================== */

export async function getNotices() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "NOTICES", "READ");

  const notices = await db.notice.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return notices;
}

export async function createNotice(data: CreateNoticeInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "NOTICES", "CREATE");
  } catch (err: any) {
    return { error: err.message };
  }

  const parsed = createNoticeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const expiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null;

  const newNotice = await db.notice.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      expiryDate,
      createdById: session.user.id,
    },
  });

  // Broadcast notification to ALL active users
  const activeUsers = await db.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  const notifications = activeUsers.map((u) => ({
    userId: u.id,
    title: `Notice: ${newNotice.title}`,
    message: newNotice.description.substring(0, 100) + "...",
    type: "NOTICE" as const,
  }));

  if (notifications.length > 0) {
    await db.notification.createMany({ data: notifications });
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "CREATE_NOTICE",
      entity: "Notice",
      entityId: newNotice.id,
      details: `Published notice "${newNotice.title}" (${newNotice.priority})`,
    },
  });

  revalidatePath("/notices");
  return { success: true, notice: newNotice };
}

export async function deleteNotice(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  try {
    enforcePermission(session.user.role, "NOTICES", "DELETE");
  } catch (err: any) {
    return { error: err.message };
  }

  await db.notice.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "DELETE_NOTICE",
      entity: "Notice",
      entityId: id,
      details: `Deleted notice ${id}`,
    },
  });

  revalidatePath("/notices");
  return { success: true };
}

/* ==========================================================================
   NOTIFICATIONS ACTIONS
   ========================================================================== */

export async function getUserNotifications() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  await db.notification.update({
    where: { id },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { success: true };
}

/* ==========================================================================
   AUDIT LOGS ACTIONS
   ========================================================================== */

export async function getAuditLogs() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  enforcePermission(session.user.role, "AUDIT_LOGS", "READ");

  const logs = await db.auditLog.findMany({
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return logs;
}
