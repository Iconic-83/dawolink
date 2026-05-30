import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { PushService } from "../push/push.service";

const DRIVER_NEXT: Record<string, string[]> = {
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

const DRIVER_PUSH: Record<string, (orderNo: string) => { title: string; body: string }> = {
  OUT_FOR_DELIVERY: (no) => ({ title: "On the Way! 🚚", body: `${no} has been picked up and is on its way to you.` }),
  DELIVERED:        (no) => ({ title: "Delivered! 🎉",  body: `${no} has been delivered. Enjoy your medicines!` }),
};

@Injectable()
export class DriverService {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
  ) {}

  async getMyDeliveries(driverId: string) {
    return this.prisma.medicineOrder.findMany({
      where: {
        driverId,
        status: { in: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
      },
      include: {
        items: true,
        appUser: { select: { id: true, name: true, phone: true, address: true, city: true } },
        pharmacy: { select: { id: true, name: true, address: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getDeliveryHistory(driverId: string) {
    return this.prisma.medicineOrder.findMany({
      where: { driverId, status: { in: ["DELIVERED", "CANCELLED"] } },
      include: {
        appUser: { select: { id: true, name: true, phone: true } },
        pharmacy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async acceptDelivery(driverId: string, orderId: string) {
    const order = await this.prisma.medicineOrder.findFirst({
      where: { id: orderId, driverId, status: "READY_FOR_PICKUP" },
    });
    if (!order) throw new NotFoundException("Delivery not found or not assigned to you");

    return this.prisma.medicineOrder.update({
      where: { id: orderId },
      data: { status: "OUT_FOR_DELIVERY", pickedUpAt: new Date() },
      include: {
        items: true,
        appUser: { select: { id: true, name: true, phone: true, address: true, city: true } },
        pharmacy: { select: { id: true, name: true, address: true } },
      },
    });
  }

  async updateStatus(driverId: string, orderId: string, status: string) {
    const order = await this.prisma.medicineOrder.findFirst({
      where: { id: orderId, driverId },
    });
    if (!order) throw new NotFoundException("Delivery not found or not assigned to you");

    const allowed = DRIVER_NEXT[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot move delivery from ${order.status} to ${status}`);
    }

    const updated = await this.prisma.medicineOrder.update({
      where: { id: orderId },
      data: {
        status: status as any,
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      },
      include: {
        items: true,
        appUser: { select: { id: true, name: true, phone: true, address: true, city: true } },
        pharmacy: { select: { id: true, name: true } },
      },
    });

    const msgFn = DRIVER_PUSH[status];
    if (msgFn && order.appUserId) {
      const { title, body } = msgFn(order.orderNo);
      this.push.sendToUser(order.appUserId, {
        title, body,
        tag: `order-${orderId}`,
        data: { url: `/shop/orders/${orderId}` },
      }).catch(() => {});
    }

    return updated;
  }

  // Called by pharmacy to assign a driver
  async assignDriver(pharmacyId: string, orderId: string, driverId: string) {
    const order = await this.prisma.medicineOrder.findFirst({
      where: { id: orderId, pharmacyId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (!["READY_FOR_PICKUP", "PREPARING", "CONFIRMED"].includes(order.status)) {
      throw new BadRequestException("Can only assign driver to orders being prepared or ready");
    }

    const driver = await this.prisma.user.findFirst({
      where: { id: driverId, pharmacyId, role: "DELIVERY_DRIVER", isActive: true },
    });
    if (!driver) throw new NotFoundException("Driver not found in your pharmacy");

    return this.prisma.medicineOrder.update({
      where: { id: orderId },
      data: { driverId },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
        appUser: { select: { id: true, name: true } },
      },
    });
  }

  async getDrivers(pharmacyId: string) {
    return this.prisma.user.findMany({
      where: { pharmacyId, role: "DELIVERY_DRIVER", isActive: true },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  }
}
