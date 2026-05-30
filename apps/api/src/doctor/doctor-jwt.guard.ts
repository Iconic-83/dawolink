import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../common/database/prisma.service";

@Injectable()
export class DoctorJwtGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) throw new UnauthorizedException();

    const token = authHeader.slice(7);
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: this.config.get("JWT_SECRET") });
    } catch {
      throw new UnauthorizedException();
    }

    if (payload.role !== "DOCTOR") throw new UnauthorizedException();

    const doctor = await this.prisma.doctor.findUnique({ where: { id: payload.sub } });
    if (!doctor || !doctor.isActive) throw new UnauthorizedException();

    const { password: _, ...safe } = doctor;
    req.doctor = safe;
    return true;
  }
}
