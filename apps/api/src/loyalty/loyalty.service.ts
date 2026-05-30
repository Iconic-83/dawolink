import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";

export const POINTS_PER_DOLLAR = 1;      // 1 point earned per $1 spent
export const POINTS_PER_REDEEM = 10;     // 10 points = $1 discount
export const MIN_REDEEM = 50;            // minimum points to redeem

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(appUserId: string) {
    const acc = await this.prisma.loyaltyAccount.findUnique({ where: { appUserId } });
    if (acc) return acc;
    return this.prisma.loyaltyAccount.create({ data: { appUserId } });
  }

  async getAccount(appUserId: string) {
    const account = await this.getOrCreate(appUserId);
    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return { ...account, transactions };
  }

  // Award points on order delivery (fire-and-forget safe)
  async earn(appUserId: string, orderTotal: number, orderId: string) {
    try {
      const points = Math.floor(orderTotal * POINTS_PER_DOLLAR);
      if (points <= 0) return;
      const account = await this.getOrCreate(appUserId);
      await this.prisma.$transaction([
        this.prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: { points: { increment: points }, lifetimeEarned: { increment: points } },
        }),
        this.prisma.loyaltyTransaction.create({
          data: {
            accountId: account.id,
            type: "EARNED",
            points,
            orderId,
            note: `Earned from order $${orderTotal.toFixed(2)}`,
          },
        }),
      ]);
    } catch {
      // non-critical — never throw
    }
  }

  // Validate and deduct points at checkout
  async redeem(appUserId: string, pointsToRedeem: number, orderId: string): Promise<number> {
    if (pointsToRedeem < MIN_REDEEM) {
      throw new BadRequestException(`Minimum ${MIN_REDEEM} points required to redeem`);
    }
    if (pointsToRedeem % POINTS_PER_REDEEM !== 0) {
      throw new BadRequestException(`Points must be a multiple of ${POINTS_PER_REDEEM}`);
    }

    const account = await this.getOrCreate(appUserId);
    if (account.points < pointsToRedeem) {
      throw new BadRequestException(`Insufficient points. You have ${account.points} points`);
    }

    const discount = pointsToRedeem / POINTS_PER_REDEEM;

    await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { points: { decrement: pointsToRedeem } },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: "REDEEMED",
          points: -pointsToRedeem,
          orderId,
          note: `Redeemed for $${discount.toFixed(2)} discount`,
        },
      }),
    ]);

    return discount;
  }
}
