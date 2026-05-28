import { Injectable, CanActivate, ExecutionContext, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RbacService } from "./rbac.service";

export const PERMISSION_KEY = "required_permission";
export const RequirePermission = (key: string) => SetMetadata(PERMISSION_KEY, key);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbac: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || user.actorType !== "pharmacy_user") return false;

    return this.rbac.userHasPermission(user.id, required);
  }
}
