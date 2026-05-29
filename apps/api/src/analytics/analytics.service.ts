import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { Prisma } from "@dawolink/database";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPharmacyDashboard(pharmacyId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      select: { id: true },
    });
    const branchIds = branches.map((b) => b.id);

    if (!branchIds.length) {
      return {
        today: { revenue: 0, transactions: 0 },
        month: { revenue: 0 },
        inventory: { totalMedicines: 0, lowStockCount: 0, expiringCount: 0 },
      };
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayRevenue, monthRevenue, totalMedicines, lowStockCount, expiringCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { branchId: { in: branchIds }, createdAt: { gte: startOfDay }, status: "COMPLETED" },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { branchId: { in: branchIds }, createdAt: { gte: startOfMonth }, status: "COMPLETED" },
        _sum: { total: true },
      }),
      this.prisma.medicine.count({ where: { pharmacyId, isActive: true } }),
      // Raw query with IN instead of ANY to avoid Prisma array parameterization issues
      this.prisma.$queryRaw<{ count: bigint }[]>(
        Prisma.sql`SELECT COUNT(*)::int as count FROM inventory_items
                   WHERE branch_id IN (${Prisma.join(branchIds)})
                   AND quantity <= reorder_level`
      ),
      this.prisma.inventoryItem.count({
        where: {
          branchId: { in: branchIds },
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), not: null },
          quantity: { gt: 0 },
        },
      }),
    ]);

    return {
      today: {
        revenue: Number(todayRevenue._sum.total ?? 0),
        transactions: todayRevenue._count,
      },
      month: {
        revenue: Number(monthRevenue._sum.total ?? 0),
      },
      inventory: {
        totalMedicines,
        lowStockCount: Number(lowStockCount[0]?.count ?? 0),
        expiringCount,
      },
    };
  }

  async getRevenueTrend(pharmacyId: string, days = 30) {
    const branches = await this.prisma.branch.findMany({
      where: { pharmacyId },
      select: { id: true },
    });
    const branchIds = branches.map((b) => b.id);
    if (!branchIds.length) return [];

    const start = new Date();
    start.setDate(start.getDate() - days);

    return this.prisma.$queryRaw(
      Prisma.sql`
        SELECT DATE(created_at) as date,
               SUM(total)::float as revenue,
               COUNT(*)::int as transactions
        FROM transactions
        WHERE branch_id IN (${Prisma.join(branchIds)})
          AND created_at >= ${start}
          AND status = 'COMPLETED'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `
    );
  }

  async getTopMedicines(branchId: string, limit = 10) {
    return this.prisma.$queryRaw(
      Prisma.sql`
        SELECT m.id, m.name, m.category,
               SUM(ti.quantity)::int as total_sold,
               SUM(ti.total)::float as total_revenue
        FROM transaction_items ti
        JOIN medicines m ON ti.medicine_id = m.id
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE t.branch_id = ${branchId}
          AND t.status = 'COMPLETED'
          AND t.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY m.id, m.name, m.category
        ORDER BY total_sold DESC
        LIMIT ${limit}
      `
    );
  }

  async getBranchComparison(pharmacyId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { pharmacyId },
      select: { id: true, name: true },
    });

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    return Promise.all(
      branches.map(async (branch) => {
        const revenue = await this.prisma.transaction.aggregate({
          where: { branchId: branch.id, createdAt: { gte: startOfMonth }, status: "COMPLETED" },
          _sum: { total: true },
          _count: true,
        });
        return {
          branchId: branch.id,
          branchName: branch.name,
          monthlyRevenue: Number(revenue._sum.total ?? 0),
          transactionCount: revenue._count,
        };
      }),
    );
  }
}
