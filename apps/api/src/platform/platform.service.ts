import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/database/prisma.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { AdminCreatePharmacyDto } from "./dto/create-pharmacy.dto";
import { SetupDto } from "./dto/setup.dto";

@Injectable()
export class PlatformService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
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

  async listPharmacies(page = 1, limit = 20, search?: string) {
    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { city: { contains: search, mode: "insensitive" as const } }] }
      : {};

    const [pharmacies, total] = await Promise.all([
      this.prisma.pharmacy.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { branches: true, users: true } },
        },
      }),
      this.prisma.pharmacy.count({ where }),
    ]);

    return { pharmacies, total, page, limit, pages: Math.ceil(total / limit) };
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
    });
  }

  async suspendPharmacy(id: string) {
    return this.prisma.pharmacy.update({ where: { id }, data: { isActive: false } });
  }

  async activatePharmacy(id: string) {
    return this.prisma.pharmacy.update({ where: { id }, data: { isActive: true } });
  }

  async updatePlan(id: string, plan: string, planExpiry?: Date) {
    return this.prisma.pharmacy.update({
      where: { id },
      data: { plan: plan as any, planExpiry },
    });
  }

  private signAdminToken(adminId: string) {
    return this.jwt.sign({ sub: adminId, actorType: "platform_admin" });
  }
}
