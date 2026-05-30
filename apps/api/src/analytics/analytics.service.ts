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

  // ── Supplier Analytics ────────────────────────────────────────────────────

  async getSupplierAnalytics(pharmacyId: string) {
    const [topSuppliers, paymentStatus, monthlySpend, avgDelivery] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT s.name, s.id,
               COUNT(po.id)::int AS total_orders,
               COALESCE(SUM(po.total_amount), 0)::float AS total_value,
               COUNT(CASE WHEN po.status = 'RECEIVED' THEN 1 END)::int AS completed,
               COUNT(CASE WHEN po.status = 'CANCELLED' THEN 1 END)::int AS cancelled
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        WHERE po.pharmacy_id = ${pharmacyId}
        GROUP BY s.id, s.name
        ORDER BY total_value DESC
        LIMIT 10
      `),
      this.prisma.purchaseOrder.groupBy({
        by: ["paymentStatus"],
        where: { pharmacyId },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT TO_CHAR(DATE_TRUNC('month', ordered_at), 'Mon') AS month,
               COALESCE(SUM(total_amount), 0)::float AS spend,
               COUNT(*)::int AS orders
        FROM purchase_orders
        WHERE pharmacy_id = ${pharmacyId}
          AND ordered_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', ordered_at)
        ORDER BY DATE_TRUNC('month', ordered_at) ASC
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT s.name,
               ROUND(AVG(EXTRACT(EPOCH FROM (po.received_at - po.ordered_at)) / 86400))::int AS avg_days
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        WHERE po.pharmacy_id = ${pharmacyId}
          AND po.status = 'RECEIVED'
          AND po.received_at IS NOT NULL
        GROUP BY s.name
        ORDER BY avg_days ASC
        LIMIT 8
      `),
    ]);

    return {
      topSuppliers: topSuppliers.map(s => ({
        id: s.id, name: s.name,
        totalOrders: s.total_orders, totalValue: s.total_value,
        completed: s.completed, cancelled: s.cancelled,
      })),
      paymentSummary: {
        unpaid: Number(paymentStatus.find(p => p.paymentStatus === "UNPAID")?._sum?.totalAmount ?? 0),
        partial: Number(paymentStatus.find(p => p.paymentStatus === "PARTIAL")?._sum?.totalAmount ?? 0),
        paid: Number(paymentStatus.find(p => p.paymentStatus === "PAID")?._sum?.totalAmount ?? 0),
      },
      monthlySpend: monthlySpend.map(m => ({ month: m.month, spend: m.spend, orders: m.orders })),
      avgDelivery: avgDelivery.map(d => ({ name: d.name, avgDays: d.avg_days })),
    };
  }

  // ── Employee / Staff Analytics ────────────────────────────────────────────

  async getStaffAnalytics(pharmacyId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const branches = await this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      select: { id: true },
    });
    const branchIds = branches.map(b => b.id);
    if (!branchIds.length) return { salesByStaff: [], activityByStaff: [] };

    const [salesByStaff, activityByStaff] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT u.first_name || ' ' || u.last_name AS name,
               u.role,
               COUNT(t.id)::int AS transactions,
               COALESCE(SUM(t.total), 0)::float AS revenue,
               COALESCE(AVG(t.total), 0)::float AS avg_sale
        FROM transactions t
        JOIN users u ON u.id = t.user_id
        WHERE t.branch_id IN (${Prisma.join(branchIds)})
          AND t.created_at >= ${since}
          AND t.status = 'COMPLETED'
        GROUP BY u.id, u.first_name, u.last_name, u.role
        ORDER BY revenue DESC
        LIMIT 20
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT u.first_name || ' ' || u.last_name AS name,
               al.action,
               COUNT(*)::int AS count
        FROM audit_logs al
        JOIN users u ON u.id = al.user_id
        WHERE al.pharmacy_id = ${pharmacyId}
          AND al.created_at >= ${since}
          AND al.action IN ('STOCK_ADDED', 'STOCK_ADJUSTED', 'SALE')
          AND al.user_id IS NOT NULL
        GROUP BY u.first_name, u.last_name, al.action
        ORDER BY count DESC
        LIMIT 30
      `),
    ]);

    return {
      salesByStaff: salesByStaff.map(s => ({
        name: s.name, role: s.role,
        transactions: s.transactions, revenue: s.revenue, avgSale: s.avg_sale,
      })),
      activityByStaff: activityByStaff.map(a => ({
        name: a.name, action: a.action, count: a.count,
      })),
    };
  }

  // ── Regional / Demand Analytics ───────────────────────────────────────────

  async getRegionalAnalytics(pharmacyId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const branches = await this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      select: { id: true },
    });
    const branchIds = branches.map(b => b.id);
    if (!branchIds.length) return { topMedicines: [], categoryTrend: [], paymentMethods: [] };

    const [topMedicines, categoryTrend, paymentMethods] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT m.name, m.category,
               SUM(ti.quantity)::int AS total_qty,
               COUNT(DISTINCT t.id)::int AS orders,
               SUM(ti.total)::float AS revenue
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        JOIN medicines m ON m.id = ti.medicine_id
        WHERE t.branch_id IN (${Prisma.join(branchIds)})
          AND t.created_at >= ${since}
          AND t.status = 'COMPLETED'
        GROUP BY m.name, m.category
        ORDER BY total_qty DESC
        LIMIT 15
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT m.category,
               SUM(ti.quantity)::int AS total_qty,
               SUM(ti.total)::float AS revenue
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        JOIN medicines m ON m.id = ti.medicine_id
        WHERE t.branch_id IN (${Prisma.join(branchIds)})
          AND t.created_at >= ${since}
          AND t.status = 'COMPLETED'
        GROUP BY m.category
        ORDER BY revenue DESC
        LIMIT 12
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT payment_method,
               COUNT(*)::int AS count,
               SUM(total)::float AS revenue
        FROM transactions
        WHERE branch_id IN (${Prisma.join(branchIds)})
          AND created_at >= ${since}
          AND status = 'COMPLETED'
        GROUP BY payment_method
        ORDER BY count DESC
      `),
    ]);

    return {
      topMedicines: topMedicines.map(m => ({
        name: m.name, category: m.category,
        totalQty: m.total_qty, orders: m.orders, revenue: m.revenue,
      })),
      categoryTrend: categoryTrend.map(c => ({
        category: c.category, totalQty: c.total_qty, revenue: c.revenue,
      })),
      paymentMethods: paymentMethods.map(p => ({
        method: p.payment_method, count: p.count, revenue: p.revenue,
      })),
    };
  }
}
