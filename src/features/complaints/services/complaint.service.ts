import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { Role, Priority, ComplaintStatus } from "@prisma/client";

export type ServiceResult<T = any> = {
  success?: boolean;
  error?: string;
  [key: string]: any;
};

export class ComplaintService {
  public static async getComplaints(
    actorRole: Role,
    actorPermissions?: string[],
    userId?: string,
    categoryFilter?: string,
    priorityFilter?: string,
    statusFilter?: string
  ) {
    PermissionService.enforce(actorRole, "COMPLAINTS", "READ", actorPermissions);

    const where: any = {};
    if (actorRole === Role.USER) {
      where.userId = userId;
    }

    if (categoryFilter && categoryFilter !== "ALL") {
      where.category = categoryFilter;
    }

    if (priorityFilter && priorityFilter !== "ALL") {
      where.priority = priorityFilter;
    }

    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    return await db.complaint.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  public static async createComplaint(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: { title: string; category: any; description: string; priority: Priority }
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "COMPLAINTS", "CREATE", actorPermissions);

    const complaint = await db.complaint.create({
      data: {
        userId: actorId,
        title: data.title,
        category: data.category,
        description: data.description,
        priority: data.priority,
      },
    });

    await AuditService.logActivity({
      actorId,
      action: "CREATE_COMPLAINT",
      entity: "Complaint",
      entityId: complaint.id,
      details: `Submitted ticket: ${complaint.title} (${complaint.priority})`,
    });

    return { success: true, complaint };
  }

  public static async updateStatus(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    id: string,
    status: ComplaintStatus,
    adminNote?: string
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "COMPLAINTS", "UPDATE", actorPermissions);

    const updated = await db.complaint.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || null,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
    });

    await AuditService.logActivity({
      actorId,
      action: "UPDATE_COMPLAINT_STATUS",
      entity: "Complaint",
      entityId: id,
      details: `Updated ticket status to ${status}`,
    });

    return { success: true, complaint: updated };
  }
}
