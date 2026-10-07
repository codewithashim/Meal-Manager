import { db } from "@/services/db.service";
import { PermissionService } from "@/services/permission.service";
import { AuditService } from "@/services/audit.service";
import { Role, Priority } from "@prisma/client";

export type ServiceResult<T = any> = {
  success?: boolean;
  error?: string;
  [key: string]: any;
};

export class NoticeService {
  public static async getNotices(actorRole: Role, actorPermissions?: string[]) {
    PermissionService.enforce(actorRole, "NOTICES", "READ", actorPermissions);

    return await db.notice.findMany({
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  public static async createNotice(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    data: { title: string; description: string; priority: Priority }
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "NOTICES", "CREATE", actorPermissions);

    const notice = await db.notice.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        createdById: actorId,
      },
    });

    await AuditService.logActivity({
      actorId,
      action: "CREATE_NOTICE",
      entity: "Notice",
      entityId: notice.id,
      details: `Published announcement: ${notice.title}`,
    });

    return { success: true, notice };
  }

  public static async deleteNotice(
    actorId: string,
    actorRole: Role,
    actorPermissions: string[] | undefined,
    id: string
  ): Promise<ServiceResult> {
    PermissionService.enforce(actorRole, "NOTICES", "DELETE", actorPermissions);

    const notice = await db.notice.findUnique({ where: { id } });
    if (!notice) return { error: "Notice not found." };

    await db.notice.delete({ where: { id } });

    await AuditService.logActivity({
      actorId,
      action: "DELETE_NOTICE",
      entity: "Notice",
      entityId: id,
      details: `Deleted notice ${notice.title}`,
    });

    return { success: true };
  }
}
