import { Injectable, NotFoundException, ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/database/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PushService } from "../push/push.service";
import { MailService } from "../common/mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { CustomerRegisterDto } from "./dto/customer-register.dto";
import { CustomerLoginDto } from "./dto/customer-login.dto";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private notifications: NotificationsService,
    private push: PushService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  // ── Customer Auth ─────────────────────────────────────────────────────────

  async register(dto: CustomerRegisterDto) {
    const byPhone = await this.prisma.appUser.findUnique({ where: { phone: dto.phone } });
    if (byPhone) throw new ConflictException("Phone number already registered");

    if (dto.email) {
      const byEmail = await this.prisma.appUser.findUnique({ where: { email: dto.email } });
      if (byEmail) throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.appUser.create({
      data: { name: dto.name, phone: dto.phone, passwordHash, email: dto.email, city: dto.city, address: dto.address },
      select: { id: true, name: true, phone: true, email: true, city: true, createdAt: true },
    });

    const token = this.signToken(user.id);
    return { user, token };
  }

  async login(dto: CustomerLoginDto) {
    const user = await this.prisma.appUser.findUnique({ where: { phone: dto.phone } });
    if (!user || !user.isActive) throw new UnauthorizedException("Invalid phone number or password");

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid phone number or password");

    await this.prisma.appUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = this.signToken(user.id);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  private signToken(userId: string) {
    return this.jwt.sign({ sub: userId, actorType: "customer" });
  }

  // ── Public medicine search & detail ───────────────────────────────────────

  async searchMedicines(q: string, page = 1, limit = 20) {
    const nameFilter = q.trim()
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { genericName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const medicines = await this.prisma.medicine.findMany({
      where: {
        isActive: true,
        verificationStatus: "VERIFIED",
        pharmacy: { isActive: true },
        inventory: { some: { branch: { isActive: true, pharmacy: { isActive: true } } } },
        ...nameFilter,
      },
      select: {
        id: true,
        name: true,
        genericName: true,
        form: true,
        strength: true,
        category: true,
        requiresPrescription: true,
        imageUrl: true,
        inventory: {
          where: { branch: { isActive: true } },
          select: {
            quantity: true,
            reorderLevel: true,
            sellingPrice: true,
            branch: { select: { pharmacy: { select: { id: true } } } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Group by (name, form, strength) to deduplicate across pharmacies
    const groups = new Map<string, {
      id: string; name: string; genericName: string | null; form: string;
      strength: string | null; category: string; requiresPrescription: boolean;
      imageUrl: string | null; pharmacyIds: Set<string>;
      prices: number[]; hasGoodStock: boolean; hasLowStock: boolean;
    }>();

    for (const med of medicines) {
      const key = `${med.name.toLowerCase()}||${med.form}||${med.strength ?? ""}`;
      if (!groups.has(key)) {
        groups.set(key, {
          id: med.id, name: med.name, genericName: med.genericName,
          form: med.form, strength: med.strength, category: med.category,
          requiresPrescription: med.requiresPrescription, imageUrl: med.imageUrl,
          pharmacyIds: new Set(), prices: [], hasGoodStock: false, hasLowStock: false,
        });
      }
      const g = groups.get(key)!;
      if (med.imageUrl && !g.imageUrl) g.imageUrl = med.imageUrl;

      for (const inv of med.inventory) {
        g.pharmacyIds.add(inv.branch.pharmacy.id);
        g.prices.push(Number(inv.sellingPrice));
        if (inv.quantity > inv.reorderLevel) g.hasGoodStock = true;
        if (inv.quantity > 0 && inv.quantity <= inv.reorderLevel) g.hasLowStock = true;
      }
    }

    const all = Array.from(groups.values()).map(g => ({
      id: g.id,
      name: g.name,
      genericName: g.genericName,
      form: g.form,
      strength: g.strength,
      category: g.category,
      requiresPrescription: g.requiresPrescription,
      imageUrl: g.imageUrl,
      lowestPrice: g.prices.length ? Math.min(...g.prices) : 0,
      pharmacyCount: g.pharmacyIds.size,
      availability: g.hasGoodStock ? "available" : g.hasLowStock ? "low_stock" : "out_of_stock",
    }));

    const total = all.length;
    const results = all.slice((page - 1) * limit, page * limit);
    return { results, total, page, limit };
  }

  async getMedicineDetail(id: string) {
    const medicine = await this.prisma.medicine.findFirst({
      where: { id, isActive: true, verificationStatus: "VERIFIED" },
      select: {
        id: true, name: true, genericName: true, form: true,
        strength: true, unit: true, category: true,
        requiresPrescription: true, imageUrl: true, description: true,
      },
    });
    if (!medicine) throw new NotFoundException("Medicine not found");

    // All pharmacies that carry a medicine with the same name + form
    const siblings = await this.prisma.medicine.findMany({
      where: {
        isActive: true,
        verificationStatus: "VERIFIED",
        form: medicine.form,
        name: { equals: medicine.name, mode: "insensitive" },
        pharmacy: { isActive: true },
      },
      select: {
        inventory: {
          where: { branch: { isActive: true } },
          select: {
            quantity: true,
            reorderLevel: true,
            sellingPrice: true,
            branch: {
              select: {
                id: true, name: true, address: true, phone: true,
                pharmacy: { select: { id: true, name: true, city: true } },
              },
            },
          },
        },
      },
    });

    // Build pharmacy availability list — deduplicated, best price per pharmacy
    const pharmacyMap = new Map<string, {
      id: string; name: string; city: string; branchName: string;
      branchAddress: string; phone: string | null;
      price: number; availability: string;
    }>();

    for (const sib of siblings) {
      for (const inv of sib.inventory) {
        const pharId = inv.branch.pharmacy.id;
        const avail =
          inv.quantity === 0 ? "out_of_stock"
          : inv.quantity <= inv.reorderLevel ? "low_stock"
          : "available";
        const price = Number(inv.sellingPrice);
        const existing = pharmacyMap.get(pharId);
        if (!existing || price < existing.price) {
          pharmacyMap.set(pharId, {
            id: pharId,
            name: inv.branch.pharmacy.name,
            city: inv.branch.pharmacy.city,
            branchName: inv.branch.name,
            branchAddress: inv.branch.address,
            phone: inv.branch.phone,
            price,
            availability: avail,
          });
        }
      }
    }

    // Enrich with GlobalMedicine data (richer medical info)
    const globalMed = await this.prisma.globalMedicine.findFirst({
      where: {
        isApproved: true,
        isFlagged: false,
        OR: [
          { name: { contains: medicine.name, mode: "insensitive" } },
          { genericName: { contains: medicine.name, mode: "insensitive" } },
        ],
      },
      select: {
        description: true, sideEffects: true,
        contraindications: true, storageConditions: true, imageUrl: true,
      },
    });

    const pharmacies = Array.from(pharmacyMap.values()).sort((a, b) =>
      a.availability === "available" && b.availability !== "available" ? -1
      : b.availability === "available" && a.availability !== "available" ? 1
      : a.price - b.price
    );

    return {
      id: medicine.id,
      name: medicine.name,
      genericName: medicine.genericName,
      form: medicine.form,
      strength: medicine.strength,
      unit: medicine.unit,
      category: medicine.category,
      requiresPrescription: medicine.requiresPrescription,
      imageUrl: medicine.imageUrl ?? globalMed?.imageUrl ?? null,
      description: medicine.description ?? globalMed?.description ?? null,
      sideEffects: globalMed?.sideEffects ?? null,
      contraindications: globalMed?.contraindications ?? null,
      storageConditions: globalMed?.storageConditions ?? null,
      pharmacies,
    };
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  async createOrder(appUserId: string, dto: CreateOrderDto) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: dto.pharmacyId },
      select: { id: true, isActive: true, name: true, email: true },
    });
    if (!pharmacy || !pharmacy.isActive) throw new NotFoundException("Pharmacy not found");

    const subtotal = dto.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const deliveryFee = dto.deliveryType === "DELIVERY" ? 2.0 : 0;
    const total = subtotal + deliveryFee;
    const orderNo = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const order = await this.prisma.medicineOrder.create({
      data: {
        orderNo,
        appUserId,
        pharmacyId: dto.pharmacyId,
        branchId: dto.branchId,
        deliveryType: dto.deliveryType,
        deliveryAddress: dto.deliveryAddress,
        deliveryCity: dto.deliveryCity,
        paymentMethod: dto.paymentMethod,
        paymentStatus: "PENDING",
        subtotal,
        deliveryFee,
        total,
        notes: dto.notes,
        prescriptionUrl: dto.prescriptionUrl ?? null,
        prescriptionStatus: dto.prescriptionUrl ? "PENDING_REVIEW" : "NONE",
        items: {
          create: dto.items.map(i => ({
            medicineName: i.medicineName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        pharmacy: { select: { id: true, name: true, city: true } },
        appUser: { select: { name: true } },
      },
    });

    // Push confirmation to customer (fire-and-forget)
    this.push.sendToUser(appUserId, {
      title: "Order Received! 🛍️",
      body: `${order.pharmacy?.name ?? "The pharmacy"} has received your order ${order.orderNo}. We'll confirm it shortly.`,
      tag: `order-${order.id}`,
      data: { url: `/shop/orders/${order.id}` },
    }).catch(() => {/* non-critical */});

    // Notify connected pharmacy staff immediately via SSE
    this.notifications.emit(dto.pharmacyId, "new_order", {
      id: order.id,
      orderNo: order.orderNo,
      customerName: order.appUser?.name ?? "Customer",
      total: Number(order.total),
      itemCount: order.items.length,
      deliveryType: order.deliveryType,
    });

    // Email pharmacy in case staff aren't logged in
    if (pharmacy.email) {
      const dashboardUrl = `${this.config.get<string>("FRONTEND_URL", "https://dawolink.com")}/orders`;
      this.mail.sendNewOrderNotification({
        to: pharmacy.email,
        pharmacyName: pharmacy.name,
        orderNo: order.orderNo,
        customerName: order.appUser?.name ?? "Customer",
        total: Number(order.total),
        itemCount: order.items.length,
        deliveryType: order.deliveryType ?? "DELIVERY",
        dashboardUrl,
      });
    }

    return order;
  }

  async getMyOrders(appUserId: string) {
    return this.prisma.medicineOrder.findMany({
      where: { appUserId },
      include: {
        items: true,
        pharmacy: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOrderById(appUserId: string, orderId: string) {
    const order = await this.prisma.medicineOrder.findFirst({
      where: { id: orderId, appUserId },
      include: {
        items: true,
        pharmacy: { select: { id: true, name: true, city: true, phone: true } },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async cancelOrder(appUserId: string, orderId: string) {
    const order = await this.prisma.medicineOrder.findFirst({
      where: { id: orderId, appUserId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== "PENDING") {
      throw new BadRequestException("Only pending orders can be cancelled");
    }
    return this.prisma.medicineOrder.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: {
        items: true,
        pharmacy: { select: { id: true, name: true, city: true } },
      },
    });
  }
}
