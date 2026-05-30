import { Injectable, UnauthorizedException, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../common/database/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class SupplierPortalService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const user = await this.prisma.supplierUser.findUnique({
      where: { email },
      include: { supplier: { select: { id: true, name: true, pharmacyId: true } } },
    });
    if (!user || !user.isActive) throw new UnauthorizedException("Invalid credentials");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    await this.prisma.supplierUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = this.jwt.sign({
      sub: user.id,
      supplierId: user.supplierId,
      pharmacyId: user.supplier.pharmacyId,
      actorType: "supplier_user",
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async getMe(userId: string) {
    const user = await this.prisma.supplierUser.findUnique({
      where: { id: userId },
      include: { supplier: true },
    });
    if (!user) throw new NotFoundException("User not found");
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  // ── Purchase Orders ───────────────────────────────────────────────────────

  async getOrders(supplierId: string, status?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        items: true,
        supplier: { select: { name: true } },
      },
      orderBy: { orderedAt: "desc" },
      take: 100,
    });
  }

  async getOrder(supplierId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, supplierId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async confirmOrder(supplierId: string, id: string, note?: string) {
    const order = await this.prisma.purchaseOrder.findFirst({ where: { id, supplierId } });
    if (!order) throw new NotFoundException("Order not found");
    if (!["PENDING"].includes(order.status)) {
      throw new BadRequestException(`Cannot confirm order in ${order.status} status`);
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        supplierConfirmedAt: new Date(),
        supplierNote: note ?? null,
      },
      include: { items: true },
    });
  }

  async rejectOrder(supplierId: string, id: string, note: string) {
    const order = await this.prisma.purchaseOrder.findFirst({ where: { id, supplierId } });
    if (!order) throw new NotFoundException("Order not found");
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: "CANCELLED", supplierNote: note },
      include: { items: true },
    });
  }

  async getStats(supplierId: string) {
    const [pending, confirmed, received, cancelled, totalRevenue] = await Promise.all([
      this.prisma.purchaseOrder.count({ where: { supplierId, status: "PENDING" } }),
      this.prisma.purchaseOrder.count({ where: { supplierId, status: "CONFIRMED" } }),
      this.prisma.purchaseOrder.count({ where: { supplierId, status: "RECEIVED" } }),
      this.prisma.purchaseOrder.count({ where: { supplierId, status: "CANCELLED" } }),
      this.prisma.purchaseOrder.aggregate({
        where: { supplierId, status: "RECEIVED" },
        _sum: { totalAmount: true },
      }),
    ]);
    return {
      pending,
      confirmed,
      received,
      cancelled,
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    };
  }

  // ── Pharmacy: create supplier user ─────────────────────────────────────────

  async createSupplierUser(pharmacyId: string, supplierId: string, dto: {
    email: string; password: string; firstName: string; lastName: string; phone?: string;
  }) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, pharmacyId } });
    if (!supplier) throw new NotFoundException("Supplier not found");

    const existing = await this.prisma.supplierUser.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.supplierUser.create({
      data: { supplierId, email: dto.email, passwordHash, firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, createdAt: true },
    });
    return user;
  }

  async listSupplierUsers(pharmacyId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, pharmacyId } });
    if (!supplier) throw new NotFoundException("Supplier not found");
    return this.prisma.supplierUser.findMany({
      where: { supplierId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, lastLoginAt: true, createdAt: true },
    });
  }
}
