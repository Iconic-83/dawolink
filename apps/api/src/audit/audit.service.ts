import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";

export interface AuditLogPayload {
  pharmacyId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogPayload): Promise<void> {
    await this.prisma.auditLog.create({ data }).catch(() => {});
  }
}
