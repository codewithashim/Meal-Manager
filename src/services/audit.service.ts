import { db } from "./db.service";

export interface LogActivityParams {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string | null;
  ipAddress?: string | null;
}

export class AuditService {
  public static async logActivity(params: LogActivityParams) {
    try {
      return await db.auditLog.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          details: params.details || null,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (error) {
      console.error("Audit log creation error:", error);
    }
  }

  public static async getLogs(limit = 100) {
    return await db.auditLog.findMany({
      include: {
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }
}
