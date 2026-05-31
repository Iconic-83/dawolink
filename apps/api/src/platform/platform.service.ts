import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/database/prisma.service";
import { RbacService } from "../rbac/rbac.service";
import { InboxService } from "../inbox/inbox.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { AdminCreatePharmacyDto } from "./dto/create-pharmacy.dto";
import { SetupDto } from "./dto/setup.dto";

@Injectable()
export class PlatformService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private rbac: RbacService,
    private inbox: InboxService,
  ) {}

  async setup(dto: SetupDto) {
    const expectedKey = this.config.get<string>("PLATFORM_SETUP_KEY");
    if (!expectedKey || dto.setupKey !== expectedKey) {
      throw new UnauthorizedException("Invalid setup key");
    }

    const count = await this.prisma.platformAdmin.count();
    if (count > 0) {
      throw new ConflictException("Platform already set up");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const admin = await this.prisma.platformAdmin.create({
      data: { email: dto.email, firstName: dto.firstName, lastName: dto.lastName, passwordHash },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    const token = this.signAdminToken(admin.id);
    return { admin, token };
  }

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { email: dto.email } });
    if (!admin || !admin.isActive) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    await this.prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.signAdminToken(admin.id);
    const { passwordHash: _, ...safeAdmin } = admin;
    return { admin: safeAdmin, token };
  }

  async getEcosystemStats() {
    const [pharmacies, branches, users, transactions] = await Promise.all([
      this.prisma.pharmacy.count(),
      this.prisma.branch.count(),
      this.prisma.user.count(),
      this.prisma.transaction.count(),
    ]);

    const revenue = await this.prisma.transaction.aggregate({
      _sum: { total: true },
      where: { status: "COMPLETED" },
    });

    const recentPharmacies = await this.prisma.pharmacy.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, plan: true, isActive: true, createdAt: true, city: true },
    });

    return {
      totalPharmacies: pharmacies,
      totalBranches: branches,
      totalUsers: users,
      totalTransactions: transactions,
      totalRevenue: revenue._sum.total ?? 0,
      recentPharmacies,
    };
  }

  async listPharmacies(page = 1, limit = 20, search?: string, plan?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }
    if (plan && plan !== "ALL") where.plan = plan;

    const [pharmacies, total] = await Promise.all([
      this.prisma.pharmacy.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { branches: true, users: true } },
          subscription: { select: { status: true, currentPeriodEnd: true, plan: true } },
        },
      }),
      this.prisma.pharmacy.count({ where }),
    ]);

    // Plan summary counts
    const [starter, professional, enterprise] = await Promise.all([
      this.prisma.pharmacy.count({ where: { plan: "STARTER" } }),
      this.prisma.pharmacy.count({ where: { plan: "PROFESSIONAL" } }),
      this.prisma.pharmacy.count({ where: { plan: "ENTERPRISE" } }),
    ]);

    return { pharmacies, total, page, limit, pages: Math.ceil(total / limit), summary: { starter, professional, enterprise } };
  }

  async createPharmacy(dto: AdminCreatePharmacyDto) {
    const existing = await this.prisma.pharmacy.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException("Pharmacy slug already taken");

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 12);

    return this.prisma.$transaction(async (tx) => {
      const pharmacy = await tx.pharmacy.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          phone: dto.phone,
          address: dto.address,
          city: dto.city,
          email: dto.email,
          licenseNo: dto.licenseNo,
          plan: dto.plan ?? "STARTER",
        },
      });

      const branch = await tx.branch.create({
        data: {
          pharmacyId: pharmacy.id,
          name: "Main Branch",
          address: pharmacy.address,
          isMain: true,
        },
      });

      const owner = await tx.user.create({
        data: {
          pharmacyId: pharmacy.id,
          branchId: branch.id,
          email: dto.ownerEmail,
          firstName: dto.ownerFirstName,
          lastName: dto.ownerLastName,
          passwordHash,
          role: "PHARMACY_OWNER",
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      return { pharmacy, branch, owner };
    }).then(async result => {
      // Seed default roles for the new pharmacy
      await this.rbac.seedDefaultRoles(result.pharmacy.id);
      return result;
    });
  }

  async suspendPharmacy(id: string) {
    return this.prisma.pharmacy.update({ where: { id }, data: { isActive: false } });
  }

  async activatePharmacy(id: string) {
    return this.prisma.pharmacy.update({ where: { id }, data: { isActive: true } });
  }

  async updatePlan(id: string, plan: string, planExpiry?: Date) {
    const pharmacy = await this.prisma.pharmacy.update({
      where: { id },
      data: { plan: plan as any, ...(planExpiry && { planExpiry }) },
    });

    // Sync subscription record
    await this.prisma.subscription.upsert({
      where: { pharmacyId: id },
      create: {
        pharmacyId: id,
        plan: plan as any,
        status: "ACTIVE",
        billingCycle: "ANNUAL",
        currentPeriodStart: new Date(),
        currentPeriodEnd: planExpiry ?? new Date(Date.now() + 365 * 86400000),
        amount: plan === "STARTER" ? 29 : plan === "PROFESSIONAL" ? 79 : 0,
      },
      update: {
        plan: plan as any,
        status: "ACTIVE",
        ...(planExpiry && { currentPeriodEnd: planExpiry }),
      },
    });

    return pharmacy;
  }

  async extendSubscription(id: string, months: number) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id },
      select: { planExpiry: true, plan: true },
    });
    const base = pharmacy?.planExpiry && pharmacy.planExpiry > new Date()
      ? pharmacy.planExpiry
      : new Date();
    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + months);

    await this.prisma.pharmacy.update({ where: { id }, data: { planExpiry: newExpiry, isActive: true } });
    await this.prisma.subscription.upsert({
      where: { pharmacyId: id },
      create: {
        pharmacyId: id, plan: pharmacy!.plan as any,
        status: "ACTIVE", billingCycle: "MONTHLY",
        currentPeriodStart: new Date(), currentPeriodEnd: newExpiry,
        amount: 0,
      },
      update: { status: "ACTIVE", currentPeriodEnd: newExpiry },
    });

    return { extended: true, newExpiry, months };
  }

  async getPharmacyDetail(id: string) {
    return this.prisma.pharmacy.findUnique({
      where: { id },
      include: {
        subscription: true,
        _count: { select: { branches: true, users: true, medicines: true, medicineOrders: true } },
        branches: { select: { id: true, name: true, isActive: true } },
      },
    });
  }

  // ── Medicine Verification ─────────────────────────────────────────────────

  async listPendingMedicines(page = 1, limit = 30, search?: string) {
    const where: any = {
      verificationStatus: "PENDING_VERIFICATION",
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { genericName: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [medicines, total] = await Promise.all([
      this.prisma.medicine.findMany({
        where,
        include: { pharmacy: { select: { id: true, name: true, city: true } } },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.medicine.count({ where }),
    ]);

    return { medicines, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async verifyMedicine(id: string) {
    return this.prisma.medicine.update({
      where: { id },
      data: { verificationStatus: "VERIFIED", verificationNotes: null },
      include: { pharmacy: { select: { name: true } } },
    });
  }

  async rejectMedicine(id: string, notes: string) {
    const medicine = await this.prisma.medicine.update({
      where: { id },
      data: { verificationStatus: "REJECTED", verificationNotes: notes },
      include: { pharmacy: { select: { id: true, name: true } } },
    });

    this.inbox.push(
      medicine.pharmacy.id,
      "SYSTEM",
      `Medicine Rejected: ${medicine.name}`,
      `Reason: ${notes}. Please correct and re-add the medicine.`,
      "/inventory",
    );

    return medicine;
  }

  async getPendingCount() {
    return this.prisma.medicine.count({ where: { verificationStatus: "PENDING_VERIFICATION" } });
  }

  // ── Pharmacy Verification ─────────────────────────────────────────────────
  async listPendingPharmacies() {
    return this.prisma.pharmacy.findMany({
      where: { verificationStatus: "PENDING" },
      select: {
        id: true, name: true, city: true, phone: true, email: true,
        licenseNo: true, licenseUrl: true, registrationCertUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async verifyPharmacy(id: string) {
    const pharmacy = await this.prisma.pharmacy.update({
      where: { id },
      data: { verificationStatus: "VERIFIED", verifiedAt: new Date(), verificationNote: null },
    });
    this.inbox.push(id, "SYSTEM", "Pharmacy Verified ✓",
      "Your pharmacy has been verified by DawoLink. You are now visible in the national marketplace.",
      "/pharmacy");
    return pharmacy;
  }

  async rejectPharmacy(id: string, note: string) {
    const pharmacy = await this.prisma.pharmacy.update({
      where: { id },
      data: { verificationStatus: "REJECTED", verificationNote: note },
    });
    this.inbox.push(id, "SYSTEM", "Pharmacy Verification Rejected",
      `Reason: ${note}. Please update your details and resubmit.`,
      "/pharmacy");
    return pharmacy;
  }

  // ── Support Tickets ───────────────────────────────────────────────────────
  async listSupportTickets(status?: string) {
    return this.prisma.supportTicket.findMany({
      where: status ? { status: status as any } : undefined,
      include: { pharmacy: { select: { name: true, city: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });
  }

  async updateTicketStatus(id: string, status: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: status as any,
        resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : undefined,
      },
    });
  }

  private signAdminToken(adminId: string) {
    return this.jwt.sign({ sub: adminId, actorType: "platform_admin" });
  }
}
