import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../common/database/prisma.service";
import { MailService } from "../common/mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { InboxService } from "../inbox/inbox.service";

@Injectable()
export class BillingCron {
  private readonly logger = new Logger(BillingCron.name);

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private config: ConfigService,
    private inbox: InboxService,
  ) {}

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

      // Suspend pharmacies and notify them
      const expiredSubs = await this.prisma.subscription.findMany({
        where: { status: "PAST_DUE", currentPeriodEnd: { lt: now } },
        include: { pharmacy: { select: { id: true, name: true, email: true } } },
      });

      await this.prisma.pharmacy.updateMany({
        where: { id: { in: expiredSubs.map(s => s.pharmacyId) } },
        data: { isActive: false },
      });

      const upgradeUrl = `${this.config.get<string>("FRONTEND_URL", "https://dawolink.com")}/billing`;
      for (const sub of expiredSubs) {
        if (!sub.pharmacy.email) continue;
        this.mail.sendSubscriptionExpired({
          to: sub.pharmacy.email,
          pharmacyName: sub.pharmacy.name,
          upgradeUrl,
        });
        this.inbox.push(
          sub.pharmacyId,
          "SUBSCRIPTION_EXPIRED",
          "Subscription Expired",
          "Your subscription has expired. Renew now to restore access.",
          "/billing",
        );
      }
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

    const upgradeUrl = `${this.config.get<string>("FRONTEND_URL", "https://dawolink.com")}/billing`;

    for (const sub of expiringSoon) {
      const daysLeft = Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000);
      this.logger.log(`Trial warning: ${sub.pharmacy.name} (${sub.pharmacy.email}) — ${daysLeft} day(s) left`);

      if (!sub.pharmacy.email) continue;
      this.mail.sendTrialExpiring({
        to: sub.pharmacy.email,
        pharmacyName: sub.pharmacy.name,
        daysLeft,
        upgradeUrl,
      });
      this.inbox.push(
        sub.pharmacyId,
        "SUBSCRIPTION_EXPIRING",
        `Trial Expiring in ${daysLeft} Day${daysLeft === 1 ? "" : "s"}`,
        "Upgrade your plan to keep full access after your trial ends.",
        "/billing",
      );
    }
  }
}
