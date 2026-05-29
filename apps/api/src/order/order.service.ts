import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";

// Valid next status for each current status (pharmacy side)
const NEXT_STATUS: Record<string, string[]> = {
  PENDING:          ["CONFIRMED", "CANCELLED"],
  CONFIRMED:        ["PREPARING", "CANCELLED"],
  PREPARING:        ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED:        [],
  CANCELLED:        [],
};

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async getOrders(pharmacyId: string, status?: string) {
    return this.prisma.medicineOrder.findMany({
      where: {
        pharmacyId,
        ...(status && status !== "ALL" ? { status: status as any } : {}),
      },
      include: {
        items: true,
        appUser: { select: { id: true, name: true, phone: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getStats(pharmacyId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [pending, confirmed, preparing, readyOrOut, deliveredToday, totalToday] =
      await Promise.all([
        this.prisma.medicineOrder.count({ where: { pharmacyId, status: "PENDING" } }),
        this.prisma.medicineOrder.count({ where: { pharmacyId, status: "CONFIRMED" } }),
        this.prisma.medicineOrder.count({ where: { pharmacyId, status: "PREPARING" } }),
        this.prisma.medicineOrder.count({ where: { pharmacyId, status: { in: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] } } }),
        this.prisma.medicineOrder.count({ where: { pharmacyId, status: "DELIVERED", deliveredAt: { gte: startOfDay } } }),
        this.prisma.medicineOrder.aggregate({
          where: { pharmacyId, createdAt: { gte: startOfDay } },
          _sum: { total: true },
          _count: { id: true },
        }),
      ]);

    return {
      pending,
      confirmed,
      preparing,
      readyOrOut,
      deliveredToday,
      todayOrders: totalToday._count.id,
      todayRevenue: Number(totalToday._sum.total ?? 0),
    };
  }

  async getOrder(pharmacyId: string, id: string) {
    const order = await this.prisma.medicineOrder.findFirst({
      where: { id, pharmacyId },
      include: {
        items: true,
        appUser: { select: { id: true, name: true, phone: true, email: true, city: true, address: true } },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async updateStatus(pharmacyId: string, id: string, status: string) {
    const order = await this.prisma.medicineOrder.findFirst({ where: { id, pharmacyId } });
    if (!order) throw new NotFoundException("Order not found");

    const allowed = NEXT_STATUS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot move order from ${order.status} to ${status}. Allowed: ${allowed.join(", ") || "none"}`,
      );
    }

    const now = new Date();
    return this.prisma.medicineOrder.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === "CONFIRMED"  ? { confirmedAt: now }  : {}),
        ...(status === "DELIVERED"  ? { deliveredAt: now }  : {}),
        ...(status === "CANCELLED"  ? { cancelledAt: now }  : {}),
      },
      include: {
        items: true,
        appUser: { select: { id: true, name: true, phone: true, city: true } },
      },
    });
  }
}
