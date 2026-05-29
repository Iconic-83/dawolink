import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PrismaService } from "../common/database/prisma.service";

@ApiTags("Audit")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/audit-logs")
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiQuery({ name: "entity", required: false })
  @ApiQuery({ name: "action", required: false })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getLogs(
    @Req() req: any,
    @Query("entity") entity?: string,
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        pharmacyId: req.user.pharmacyId,
        ...(entity && { entity }),
        ...(action && { action }),
        createdAt: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit ?? "100"), 500),
    });
  }
}
