import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { Plan } from "@dawolink/database";
import { SubmitPaymentDto } from "./billing.dto";
import { PLAN_LIMITS } from "../common/guards/plan.guard";

export const PLAN_PRICES: Record<Plan, number> = {
  STARTER: 29,
  PROFESSIONAL: 79,
  ENTERPRISE: 0,
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  EVC_PLUS: "EVC Plus",
  ZAAD: "Zaad",
  SAHAL: "Sahal",
  PREMIER_WALLET: "Premier Wallet",
};

export const PLANS_INFO = [
  { plan: "STARTER", price: 29, priceAnnual: 290, label: "Starter", features: ["1 branch", "5 staff accounts", "Inventory + POS", "Expiry intelligence", "Basic analytics"] },
  { plan: "PROFESSIONAL", price: 79, priceAnnual: 790, label: "Professional", features: ["Up to 5 branches", "50 staff accounts", "All features", "Supplier & PO management", "Priority support"] },
  { plan: "ENTERPRISE", price: null, priceAnnual: null, label: "Enterprise", features: ["Unlimited branches", "Unlimited staff", "API access", "Custom domain", "SLA + dedicated support"] },
];

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(pharmacyId: string) {
    return this.prisma.subscription.findUnique({
      where: { pharmacyId },
      include: { invoices: { orderBy: { createdAt: "desc" }, take: 12 } },
    });
  }

  async createSubscription(pharmacyId: string, plan: Plan, billingCycle: "MONTHLY" | "ANNUAL" = "MONTHLY") {
    const amount = billingCycle === "ANNUAL"
      ? PLAN_PRICES[plan] * 10  // 2 months free on annual
      : PLAN_PRICES[plan];

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === "ANNUAL" ? 12 : 1));

    const subscription = await this.prisma.subscription.upsert({
      where: { pharmacyId },
      create: {
        pharmacyId,
        plan,
        billingCycle,
        amount,
        status: "TRIALING",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan,
        billingCycle,
        amount,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Update pharmacy plan
    await this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: { plan, planExpiry: periodEnd },
    });

    return subscription;
  }

  async recordPayment(pharmacyId: string, amount: number, notes?: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { pharmacyId } });
    if (!sub) throw new NotFoundException("No subscription found");

    const invoiceNo = `INV-${Date.now()}`;
    const invoice = await this.prisma.invoice.create({
      data: {
        subscriptionId: sub.id,
        pharmacyId,
        invoiceNo,
        amount,
        status: "PAID",
        dueDate: new Date(),
        paidAt: new Date(),
        notes,
      },
    });

    // Extend subscription period
    const newEnd = new Date(sub.currentPeriodEnd);
    newEnd.setMonth(newEnd.getMonth() + (sub.billingCycle === "ANNUAL" ? 12 : 1));

    await this.prisma.subscription.update({
      where: { pharmacyId },
      data: { status: "ACTIVE", currentPeriodEnd: newEnd },
    });

    return invoice;
  }

  async cancelSubscription(pharmacyId: string) {
    return this.prisma.subscription.update({
      where: { pharmacyId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  }

  async submitPayment(pharmacyId: string, dto: SubmitPaymentDto) {
    if (!dto.reference?.trim()) throw new BadRequestException("Payment reference is required");

    const plan = (dto.plan ?? "STARTER") as Plan;
    const cycle = dto.billingCycle ?? "MONTHLY";
    const expectedAmount = cycle === "ANNUAL" ? PLAN_PRICES[plan] * 10 : PLAN_PRICES[plan];

    if (dto.amount < expectedAmount) {
      throw new BadRequestException(`Amount $${dto.amount} is less than the required $${expectedAmount} for ${plan} ${cycle}`);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (cycle === "ANNUAL" ? 12 : 1));

    const sub = await this.prisma.subscription.upsert({
      where: { pharmacyId },
      create: { pharmacyId, plan, billingCycle: cycle, amount: dto.amount, status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: periodEnd },
      update: { plan, billingCycle: cycle, amount: dto.amount, status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: periodEnd },
    });

    await this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: { plan, planExpiry: periodEnd, isActive: true },
    });

    const invoiceNo = `INV-${Date.now()}`;
    const invoice = await this.prisma.invoice.create({
      data: {
        subscriptionId: sub.id,
        pharmacyId,
        invoiceNo,
        amount: dto.amount,
        status: "PAID",
        dueDate: now,
        paidAt: now,
        notes: `${PAYMENT_METHOD_LABELS[dto.method] ?? dto.method} | Ref: ${dto.reference}`,
      },
    });

    return { subscription: sub, invoice, message: "Payment recorded. Your subscription is now active." };
  }

  getPlansInfo() {
    return PLANS_INFO;
  }

  async getPlanUsage(pharmacyId: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { plan: true },
    });
    const plan = (pharmacy?.plan ?? "STARTER") as Plan;
    const limits = PLAN_LIMITS[plan];

    const [branches, staff] = await Promise.all([
      this.prisma.branch.count({ where: { pharmacyId, isActive: true } }),
      this.prisma.user.count({ where: { pharmacyId, isActive: true } }),
    ]);

    return {
      plan,
      branches: { used: branches, limit: limits.branches === Infinity ? null : limits.branches },
      staff:    { used: staff,    limit: limits.staff    === Infinity ? null : limits.staff },
    };
  }

  async listInvoices(pharmacyId: string, page = 1, limit = 20) {
    const sub = await this.prisma.subscription.findUnique({ where: { pharmacyId } });
    if (!sub) return { invoices: [], total: 0 };
    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { subscriptionId: sub.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where: { subscriptionId: sub.id } }),
    ]);
    return { invoices, total };
  }

  async getInvoice(pharmacyId: string, invoiceId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { pharmacyId },
      include: { pharmacy: { select: { name: true, address: true, city: true, phone: true, email: true, licenseNo: true } } },
    });
    if (!sub) throw new NotFoundException("Subscription not found");
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, subscriptionId: sub.id } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return { invoice, pharmacy: sub.pharmacy };
  }

  // Platform admin: overview of all subscriptions
  async getPlatformBillingOverview() {
    const [active, trialing, pastDue, cancelled] = await Promise.all([
      this.prisma.subscription.count({ where: { status: "ACTIVE" } }),
      this.prisma.subscription.count({ where: { status: "TRIALING" } }),
      this.prisma.subscription.count({ where: { status: "PAST_DUE" } }),
      this.prisma.subscription.count({ where: { status: "CANCELLED" } }),
    ]);

    const mrr = await this.prisma.subscription.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["ACTIVE", "TRIALING"] }, billingCycle: "MONTHLY" },
    });

    const arr = await this.prisma.subscription.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["ACTIVE", "TRIALING"] }, billingCycle: "ANNUAL" },
    });

    const recentInvoices = await this.prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { subscription: { include: { pharmacy: { select: { name: true } } } } },
    });

    return {
      active, trialing, pastDue, cancelled,
      mrr: Number(mrr._sum.amount ?? 0),
      arr: Number(arr._sum.amount ?? 0),
      recentInvoices,
    };
  }

  async listPharmacySubscriptions(page = 1, limit = 20) {
    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          pharmacy: { select: { id: true, name: true, city: true } },
          invoices: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      this.prisma.subscription.count(),
    ]);
    return { subscriptions, total, page, limit };
  }
}
