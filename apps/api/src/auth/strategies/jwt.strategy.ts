import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/database/prisma.service";

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

  async validate(payload: { sub: string; actorType: "platform_admin" | "pharmacy_user"; pharmacyId?: string; role?: string }) {
    if (payload.actorType === "platform_admin") {
      const admin = await this.prisma.platformAdmin.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
      });
      if (!admin || !admin.isActive) throw new UnauthorizedException();
      return { ...admin, actorType: "platform_admin" as const };
    }

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
