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

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user || user.actorType !== "pharmacy_user") return true;

    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: user.pharmacyId },
      select: { isActive: true, plan: true, planExpiry: true },
    });

    if (!pharmacy?.isActive) {
      throw new ForbiddenException("Your pharmacy account is suspended. Contact support.");
    }

    const sub = await this.prisma.subscription.findUnique({
      where: { pharmacyId: user.pharmacyId },
      select: { status: true, currentPeriodEnd: true },
    });

    if (sub) {
      const expired = new Date() > new Date(sub.currentPeriodEnd);
      if (expired && sub.status !== "ACTIVE") {
        throw new ForbiddenException("Your subscription has expired. Please renew to continue.");
      }
      if (sub.status === "SUSPENDED" || sub.status === "CANCELLED") {
        throw new ForbiddenException("Your subscription is inactive. Please renew to continue.");
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
