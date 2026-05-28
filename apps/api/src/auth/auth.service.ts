import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/database/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        role: dto.role ?? "PHARMACIST",
        pharmacyId: dto.pharmacyId,
        branchId: dto.branchId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        pharmacyId: true,
        branchId: true,
      },
    });

    const token = this.signToken(user.id, user.pharmacyId, user.role);
    return { user, token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { pharmacy: { select: { id: true, name: true, plan: true } } },
    });

    if (!user || !user.isActive) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        device: dto.device,
        ipAddress: dto.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const token = this.signToken(user.id, user.pharmacyId, user.role);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException("Email already registered");

    const slug = dto.pharmacyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const result = await this.prisma.$transaction(async (tx) => {
      const pharmacy = await tx.pharmacy.create({
        data: { name: dto.pharmacyName, slug, phone: dto.phone ?? "", address: "To be updated", city: dto.city ?? "Mogadishu", email: dto.email, plan: "STARTER" },
      });

      const branch = await tx.branch.create({
        data: { pharmacyId: pharmacy.id, name: "Main Branch", address: pharmacy.address, isMain: true },
      });

      const user = await tx.user.create({
        data: { email: dto.email, phone: dto.phone, firstName: dto.firstName, lastName: dto.lastName, passwordHash, role: "PHARMACY_OWNER", pharmacyId: pharmacy.id, branchId: branch.id },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, pharmacyId: true, branchId: true },
      });

      await tx.subscription.create({
        data: {
          pharmacyId: pharmacy.id,
          plan: "STARTER",
          billingCycle: "MONTHLY",
          amount: 0,
          status: "TRIALING",
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
        },
      });

      await tx.pharmacy.update({ where: { id: pharmacy.id }, data: { planExpiry: trialEnd } });

      return { user, pharmacy };
    });

    const token = this.signToken(result.user.id, result.user.pharmacyId!, result.user.role);
    return { user: result.user, pharmacy: result.pharmacy, trialEndsAt: trialEnd, token };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  private signToken(userId: string, pharmacyId: string | null | undefined, role: string) {
    return this.jwt.sign({ sub: userId, pharmacyId, role, actorType: "pharmacy_user" });
  }
}
