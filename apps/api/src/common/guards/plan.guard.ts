import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../database/prisma.service";

export const PLAN_KEY = "required_plan";
export const RequirePlan = (plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE") => SetMetadata(PLAN_KEY, plan);

const PLAN_RANK: Record<string, number> = { STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };

export const PLAN_LIMITS = {
  STARTER: { branches: 1, staff: 5 },
  PROFESSIONAL: { branches: 5, staff: 50 },
  ENTERPRISE: { branches: Infinity, staff: Infinity },
};

// Write methods that are blocked in soft-lock (expired) mode
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Route prefixes that are always allowed even when expired (billing + auth)
const ALWAYS_ALLOWED_PREFIXES = ["/v1/billing", "/v1/auth", "/v1/pharmacy/profile"];

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const { user } = req;

    if (!user || user.actorType !== "pharmacy_user") return true;

    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: user.pharmacyId },
      select: { isActive: true, plan: true },
    });

    if (!pharmacy?.isActive) {
      throw new ForbiddenException("Your pharmacy account is suspended. Contact support.");
    }

    const sub = await this.prisma.subscription.findUnique({
      where: { pharmacyId: user.pharmacyId },
      select: { status: true, currentPeriodEnd: true },
    });

    if (sub) {
      const isExpired = sub.status === "EXPIRED" ||
        (sub.status !== "ACTIVE" && sub.status !== "TRIALING" && new Date() > new Date(sub.currentPeriodEnd));

      if (isExpired) {
        const path: string = req.path ?? "";
        const method: string = req.method ?? "GET";

        // Billing and auth routes are always accessible so owner can renew
        const isAllowed = ALWAYS_ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix));
        if (!isAllowed && WRITE_METHODS.has(method)) {
          throw new ForbiddenException(
            "Your subscription has expired. You can view your data but cannot make changes. Renew at /billing to restore full access.",
          );
        }
      }

      if (sub.status === "CANCELLED") {
        throw new ForbiddenException("Your subscription is cancelled. Please subscribe again to continue.");
      }
    }

    const required = this.reflector.getAllAndOverride<string>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (required) {
      const userRank = PLAN_RANK[pharmacy.plan] ?? 0;
      const neededRank = PLAN_RANK[required] ?? 0;
      if (userRank < neededRank) {
        throw new ForbiddenException(`This feature requires the ${required} plan or higher.`);
      }
    }

    return true;
  }
}
