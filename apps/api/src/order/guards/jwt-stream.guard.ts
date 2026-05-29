import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/database/prisma.service";

/** Accepts JWT from Authorization header OR ?token= query param.
 *  Required for SSE endpoints because EventSource cannot set custom headers. */
@Injectable()
export class JwtStreamGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    const token: string | undefined =
      req.query?.token ??
      req.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) throw new UnauthorizedException("Missing token");

    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: this.config.get("JWT_SECRET") });
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    if (payload.actorType !== "pharmacy_user") throw new UnauthorizedException();

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, pharmacyId: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();

    req.user = { ...user, actorType: "pharmacy_user" };
    return true;
  }
}
