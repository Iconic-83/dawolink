import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../common/database/prisma.service";

@Injectable()
export class BillingCron {
  private readonly logger = new Logger(BillingCron.name);

  constructor(private prisma: PrismaService) {}

  // Runs every hour — expires TRIALING and ACTIVE subs past their period end
  @Cron(CronExpression.EVERY_HOUR)
  async expireSubscriptions() {
    const now = new Date();

    const expired = await this.prisma.subscription.updateMany({
      where: {
        status: { in: ["TRIALING", "ACTIVE"] },
        currentPeriodEnd: { lt: now },
      },
      data: { status: "PAST_DUE" },
    });

    if (expired.count > 0) {
      this.logger.warn(`Expired ${expired.count} subscription(s) to PAST_DUE`);

      // Suspend pharmacies whose subscription just expired
      const expiredSubs = await this.prisma.subscription.findMany({
        where: { status: "PAST_DUE", currentPeriodEnd: { lt: now } },
        select: { pharmacyId: true },
      });

      await this.prisma.pharmacy.updateMany({
        where: { id: { in: expiredSubs.map(s => s.pharmacyId) } },
        data: { isActive: false },
      });
    }
  }

  // Runs daily at 9am — send warning 3 days before trial ends (log only for now)
  @Cron("0 9 * * *")
  async trialExpiryWarnings() {
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiringSoon = await this.prisma.subscription.findMany({
      where: {
        status: "TRIALING",
        currentPeriodEnd: { gte: tomorrow, lte: in3Days },
      },
      include: { pharmacy: { select: { name: true, email: true } } },
    });

    for (const sub of expiringSoon) {
      const daysLeft = Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000);
      this.logger.log(`Trial warning: ${sub.pharmacy.name} (${sub.pharmacy.email}) — ${daysLeft} day(s) left`);
      // TODO: send SMS/email via Waafi/Hormuud when SMS module is wired
    }
  }
}
