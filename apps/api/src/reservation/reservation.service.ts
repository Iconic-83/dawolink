import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../common/database/prisma.service";

const HOLD_MINUTES = 120; // 2 hours

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}

  async reserve(appUserId: string, dto: {
    pharmacyId: string;
    branchId: string;
    inventoryItemId: string;
    quantity?: number;
  }) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: dto.inventoryItemId, branchId: dto.branchId, deletedAt: null },
      include: { medicine: true },
    });
    if (!item) throw new NotFoundException("Medicine not found");

    const qty = dto.quantity ?? 1;

    // Count active reservations already held on this item
    const activeHeld = await this.prisma.medicineReservation.aggregate({
      where: { inventoryItemId: dto.inventoryItemId, status: "ACTIVE" },
      _sum: { quantity: true },
    });
    const held = activeHeld._sum.quantity ?? 0;
    const available = item.quantity - held;

    if (available < qty) {
      throw new BadRequestException(
        `Only ${available} unit${available !== 1 ? "s" : ""} available for reservation`,
      );
    }

    // Check if user already has an active reservation for this item
    const existing = await this.prisma.medicineReservation.findFirst({
      where: { appUserId, inventoryItemId: dto.inventoryItemId, status: "ACTIVE" },
    });
    if (existing) throw new BadRequestException("You already have an active reservation for this medicine");

    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    return this.prisma.medicineReservation.create({
      data: {
        appUserId,
        pharmacyId: dto.pharmacyId,
        branchId: dto.branchId,
        inventoryItemId: dto.inventoryItemId,
        medicineName: item.medicine.name,
        quantity: qty,
        expiresAt,
      },
    });
  }

  async cancel(appUserId: string, reservationId: string) {
    const reservation = await this.prisma.medicineReservation.findFirst({
      where: { id: reservationId, appUserId },
    });
    if (!reservation) throw new NotFoundException("Reservation not found");
    if (reservation.status !== "ACTIVE") {
      throw new BadRequestException(`Reservation is already ${reservation.status.toLowerCase()}`);
    }

    return this.prisma.medicineReservation.update({
      where: { id: reservationId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  }

  async getMyReservations(appUserId: string) {
    return this.prisma.medicineReservation.findMany({
      where: { appUserId, status: "ACTIVE", expiresAt: { gte: new Date() } },
      orderBy: { expiresAt: "asc" },
    });
  }

  async confirmReservation(reservationId: string) {
    const reservation = await this.prisma.medicineReservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException("Reservation not found");
    if (reservation.status !== "ACTIVE") throw new BadRequestException("Reservation is not active");
    if (reservation.expiresAt < new Date()) throw new BadRequestException("Reservation has expired");

    return this.prisma.medicineReservation.update({
      where: { id: reservationId },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
  }

  async getPharmacyReservations(pharmacyId: string) {
    return this.prisma.medicineReservation.findMany({
      where: { pharmacyId, status: "ACTIVE", expiresAt: { gte: new Date() } },
      orderBy: { expiresAt: "asc" },
      include: { appUser: { select: { name: true, phone: true } } },
    });
  }

  // ── Cron: expire reservations every 5 minutes ─────────────────────────────
  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireReservations() {
    await this.prisma.medicineReservation.updateMany({
      where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });
  }
}
