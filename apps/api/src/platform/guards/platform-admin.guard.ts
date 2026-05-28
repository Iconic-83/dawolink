import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user || user.actorType !== "platform_admin") {
      throw new UnauthorizedException("Platform admin access required");
    }
    return true;
  }
}
