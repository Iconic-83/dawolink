import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";

@Injectable()
export class ExpiryService {
  constructor(private prisma: PrismaService) {}

  async getExpiringSoon(branchId: string, daysAhead = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return this.prisma.inventoryItem.findMany({
      where: {
        branchId,
        expiryDate: { lte: cutoff, gte: new Date() },
        quantity: { gt: 0 },
      },
      include: { medicine: true },
      orderBy: { expiryDate: "asc" },
    });
  }

  async getExpired(branchId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        branchId,
        expiryDate: { lt: new Date() },
        quantity: { gt: 0 },
      },
      include: { medicine: true },
      orderBy: { expiryDate: "asc" },
    });
  }

  async getExpiryDashboard(branchId: string) {
    const now = new Date();
    const in30 = new Date(); in30.setDate(now.getDate() + 30);
    const in60 = new Date(); in60.setDate(now.getDate() + 60);
    const in90 = new Date(); in90.setDate(now.getDate() + 90);

    const [expired, critical, warning, upcoming] = await Promise.all([
      this.prisma.inventoryItem.count({
        where: { branchId, expiryDate: { lt: now }, quantity: { gt: 0 } },
      }),
      this.prisma.inventoryItem.count({
        where: { branchId, expiryDate: { gte: now, lt: in30 }, quantity: { gt: 0 } },
      }),
      this.prisma.inventoryItem.count({
        where: { branchId, expiryDate: { gte: in30, lt: in60 }, quantity: { gt: 0 } },
      }),
      this.prisma.inventoryItem.count({
        where: { branchId, expiryDate: { gte: in60, lt: in90 }, quantity: { gt: 0 } },
      }),
    ]);

    return { expired, critical, warning, upcoming };
  }

  async getExpiryAlerts(pharmacyId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { pharmacyId },
      select: { id: true, name: true },
    });

    const alerts = await Promise.all(
      branches.map(async (branch) => {
        const dashboard = await this.getExpiryDashboard(branch.id);
        return { branchId: branch.id, branchName: branch.name, ...dashboard };
      }),
    );

    return alerts;
  }
}
