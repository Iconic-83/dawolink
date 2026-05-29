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

  // ── Online Order Analytics ─────────────────────────────────────────────

  async getOrderAnalytics(pharmacyId: string, days = 30) {
    const start = new Date();
    start.setDate(start.getDate() - days);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - days);

    const pid = pharmacyId;

    const [totals, prevTotals, byStatus, byDelivery, byPayment, topMedicines, byCity, peakHours] =
      await Promise.all([
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT
            COUNT(*)::int                                                  AS total_orders,
            COALESCE(SUM(total), 0)::float                                 AS total_revenue,
            COALESCE(AVG(total), 0)::float                                 AS avg_order_value,
            COUNT(*) FILTER (WHERE status = 'DELIVERED')::int              AS delivered,
            COUNT(*) FILTER (WHERE status = 'CANCELLED')::int              AS cancelled,
            COUNT(*) FILTER (WHERE status NOT IN ('CANCELLED','PENDING'))::int AS active
          FROM medicine_orders
          WHERE pharmacy_id = ${pid} AND created_at >= ${start}
        `),

        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total), 0)::float AS total_revenue
          FROM medicine_orders
          WHERE pharmacy_id = ${pid} AND created_at >= ${prevStart} AND created_at < ${start}
        `),

        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT status, COUNT(*)::int AS count
          FROM medicine_orders
          WHERE pharmacy_id = ${pid} AND created_at >= ${start}
          GROUP BY status
        `),

        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT delivery_type AS type, COUNT(*)::int AS count, COALESCE(SUM(total), 0)::float AS revenue
          FROM medicine_orders
          WHERE pharmacy_id = ${pid} AND created_at >= ${start}
          GROUP BY delivery_type
        `),

        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT COALESCE(payment_method, 'CASH') AS method,
                 COUNT(*)::int AS count,
                 COALESCE(SUM(total), 0)::float AS revenue
          FROM medicine_orders
          WHERE pharmacy_id = ${pid} AND created_at >= ${start}
          GROUP BY payment_method
          ORDER BY count DESC
        `),

        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT moi.medicine_name,
                 SUM(moi.quantity)::int  AS total_qty,
                 SUM(moi.total)::float   AS revenue
          FROM medicine_order_items moi
          JOIN medicine_orders mo ON moi.order_id = mo.id
          WHERE mo.pharmacy_id = ${pid}
            AND mo.created_at >= ${start}
            AND mo.status != 'CANCELLED'
          GROUP BY moi.medicine_name
          ORDER BY total_qty DESC
          LIMIT 10
        `),

        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT COALESCE(delivery_city, 'Unknown') AS city, COUNT(*)::int AS count
          FROM medicine_orders
          WHERE pharmacy_id = ${pid} AND created_at >= ${start}
            AND delivery_type = 'DELIVERY'
          GROUP BY delivery_city
          ORDER BY count DESC
          LIMIT 6
        `),

        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS count
          FROM medicine_orders
          WHERE pharmacy_id = ${pid} AND created_at >= ${start}
          GROUP BY hour
          ORDER BY hour
        `),
      ]);

    const t = totals[0];
    const p = prevTotals[0];

    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);

    return {
      totals: {
        orders:           t.total_orders,
        revenue:          t.total_revenue,
        avgOrderValue:    t.avg_order_value,
        fulfillmentRate:  t.total_orders > 0 ? Math.round((t.delivered / t.total_orders) * 100) : 0,
        cancellationRate: t.total_orders > 0 ? Math.round((t.cancelled / t.total_orders) * 100) : 0,
      },
      vsLastPeriod: {
        orders:  pctChange(t.total_orders, p.total_orders),
        revenue: pctChange(t.total_revenue, p.total_revenue),
      },
      byStatus:    byStatus.map(r => ({ status: r.status,   count: r.count })),
      byDelivery:  byDelivery.map(r => ({ type: r.type,     count: r.count, revenue: r.revenue })),
      byPayment:   byPayment.map(r => ({ method: r.method,  count: r.count, revenue: r.revenue })),
      topMedicines: topMedicines.map(r => ({ name: r.medicine_name, qty: r.total_qty, revenue: r.revenue })),
      byCity:      byCity.map(r => ({ city: r.city, count: r.count })),
      peakHours:   peakHours.map(r => ({ hour: r.hour, count: r.count })),
    };
  }

  async getOrderTrend(pharmacyId: string, days = 30) {
    const start = new Date();
    start.setDate(start.getDate() - days);
    return this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT DATE(created_at) AS date,
             COUNT(*)::int            AS orders,
             COALESCE(SUM(total), 0)::float AS revenue
      FROM medicine_orders
      WHERE pharmacy_id = ${pharmacyId} AND created_at >= ${start}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
  }
}
