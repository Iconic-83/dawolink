import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../common/database/prisma.service";
import { MailService } from "../common/mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { InboxService } from "../inbox/inbox.service";

// Days before expiry at which we send renewal reminders for paid subscriptions
const PAID_REMINDER_DAYS = [30, 14, 7, 3, 1];
// Days before expiry at which we send trial reminder emails
const TRIAL_REMINDER_DAYS = [7, 3, 1];

@Injectable()
export class BillingCron {
  private readonly logger = new Logger(BillingCron.name);

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private config: ConfigService,
    private inbox: InboxService,
  ) {}

  private get frontendUrl() {
    return this.config.get<string>("FRONTEND_URL", "https://dawolink.com");
  }

  // Runs every hour — soft-expires TRIALING and ACTIVE subs past their period end
  @Cron(CronExpression.EVERY_HOUR)
  async expireSubscriptions() {
    const now = new Date();

    // Find subscriptions that just expired (still TRIALING/ACTIVE but period has ended)
    const toExpire = await this.prisma.subscription.findMany({
      where: {
        status: { in: ["TRIALING", "ACTIVE"] },
        currentPeriodEnd: { lt: now },
      },
      include: { pharmacy: { select: { id: true, name: true, email: true } } },
    });

    if (toExpire.length === 0) return;

    // Soft lock: mark subscription EXPIRED but keep pharmacy active (read-only mode)
    await this.prisma.subscription.updateMany({
      where: { id: { in: toExpire.map(s => s.id) } },
      data: { status: "EXPIRED" },
    });

    this.logger.warn(`Soft-locked ${toExpire.length} subscription(s) → EXPIRED`);

    const billingUrl = `${this.frontendUrl}/billing`;

    for (const sub of toExpire) {
      const ph = sub.pharmacy;
      if (ph.email) {
        this.mail.sendSubscriptionExpired({
          to: ph.email,
          pharmacyName: ph.name,
          upgradeUrl: billingUrl,
        });
      }
      this.inbox.push(
        ph.id,
        "SUBSCRIPTION_EXPIRED",
        "Subscription Expired",
        "Your subscription has expired. Renew now to continue making sales and managing inventory.",
        "/billing",
      );
    }
  }

  // Runs daily at 9 AM — sends trial expiry warnings at 7, 3, 1 days remaining
  @Cron("0 9 * * *")
  async trialExpiryWarnings() {
    const billingUrl = `${this.frontendUrl}/billing`;

    for (const days of TRIAL_REMINDER_DAYS) {
      const windowStart = this.dayBoundaryStart(days);
      const windowEnd   = this.dayBoundaryEnd(days);

      const expiringSoon = await this.prisma.subscription.findMany({
        where: {
          status: "TRIALING",
          currentPeriodEnd: { gte: windowStart, lt: windowEnd },
        },
        include: { pharmacy: { select: { id: true, name: true, email: true } } },
      });

      for (const sub of expiringSoon) {
        const ph = sub.pharmacy;
        this.logger.log(`Trial warning (${days}d): ${ph.name} <${ph.email}>`);

        if (ph.email) {
          this.mail.sendTrialExpiring({
            to: ph.email,
            pharmacyName: ph.name,
            daysLeft: days,
            upgradeUrl: billingUrl,
          });
        }

        this.inbox.push(
          ph.id,
          "SUBSCRIPTION_EXPIRING",
          `Trial Expiring in ${days} Day${days === 1 ? "" : "s"}`,
          days === 1
            ? "Your free trial expires today. Renew now to keep full access."
            : `Your free trial expires in ${days} days. Upgrade to keep your pharmacy running.`,
          "/billing",
        );
      }
    }
  }

  // Runs daily at 9 AM — sends renewal reminders for paid (ACTIVE) subscriptions
  @Cron("0 9 * * *")
  async paidSubscriptionExpiryWarnings() {
    const billingUrl = `${this.frontendUrl}/billing`;

    for (const days of PAID_REMINDER_DAYS) {
      const windowStart = this.dayBoundaryStart(days);
      const windowEnd   = this.dayBoundaryEnd(days);

      const expiringSoon = await this.prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          currentPeriodEnd: { gte: windowStart, lt: windowEnd },
        },
        include: { pharmacy: { select: { id: true, name: true, email: true } } },
      });

      for (const sub of expiringSoon) {
        const ph = sub.pharmacy;
        this.logger.log(`Subscription renewal warning (${days}d): ${ph.name} <${ph.email}>`);

        if (ph.email) {
          this.mail.sendSubscriptionExpiring({
            to: ph.email,
            pharmacyName: ph.name,
            daysLeft: days,
            plan: sub.plan,
            billingCycle: sub.billingCycle,
            upgradeUrl: billingUrl,
          });
        }

        const urgencyLabel = days <= 3 ? "⚠️ Urgent: " : "";
        this.inbox.push(
          ph.id,
          "SUBSCRIPTION_EXPIRING",
          `${urgencyLabel}Subscription Expires in ${days} Day${days === 1 ? "" : "s"}`,
          days === 1
            ? "Your subscription expires tomorrow. Renew now to avoid interruption."
            : `Your subscription expires in ${days} days. Renew to keep your pharmacy running.`,
          "/billing",
        );
      }
    }
  }

  // Returns start of "exactly N days from now" window (midnight)
  private dayBoundaryStart(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Returns end of "exactly N days from now" window (23:59:59)
  private dayBoundaryEnd(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
