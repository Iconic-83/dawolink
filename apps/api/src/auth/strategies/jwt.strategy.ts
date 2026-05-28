import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/database/prisma.service";

type ActorType = "platform_admin" | "pharmacy_user" | "customer";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get("JWT_SECRET"),
    });
  }

  async validate(payload: { sub: string; actorType: ActorType; pharmacyId?: string; role?: string }) {
    if (payload.actorType === "platform_admin") {
      const admin = await this.prisma.platformAdmin.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
      });
      if (!admin || !admin.isActive) throw new UnauthorizedException();
      return { ...admin, actorType: "platform_admin" as const };
    }

    if (payload.actorType === "customer") {
      const appUser = await this.prisma.appUser.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, phone: true, email: true, city: true, isActive: true },
      });
      if (!appUser || !appUser.isActive) throw new UnauthorizedException();
      return { ...appUser, actorType: "customer" as const };
    }

    // Default: pharmacy_user
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        pharmacyId: true,
        branchId: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return { ...user, actorType: "pharmacy_user" as const };
  }
}
