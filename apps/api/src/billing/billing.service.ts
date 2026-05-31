import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { Plan, BillingCycle } from "@dawolink/database";
import { SubmitPaymentDto } from "./billing.dto";
import { PLAN_LIMITS } from "../common/guards/plan.guard";
import { WaafiPayService } from "../payments/waafipay.service";

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
  constructor(
    private prisma: PrismaService,
    private waafi: WaafiPayService,
  ) {}

  async getSubscription(pharmacyId: string) {
    const [sub, pendingRequest] = await Promise.all([
      this.prisma.subscription.findUnique({
        where: { pharmacyId },
        include: { invoices: { orderBy: { createdAt: "desc" }, take: 12 } },
      }),
      this.prisma.paymentRequest.findFirst({
        where: { pharmacyId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { ...sub, pendingRequest };
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

  async submitPaymentRequest(pharmacyId: string, dto: {
    plan: Plan;
    billingCycle: BillingCycle;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    phone?: string;
    referenceCode?: string;
  }) {
    const existing = await this.prisma.paymentRequest.findFirst({
      where: { pharmacyId, status: "PENDING" },
    });
    if (existing) throw new ConflictException("You already have a pending payment request. Please wait for admin review.");

    const referenceCode = dto.referenceCode ?? `DWL-${pharmacyId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.paymentRequest.create({
      data: {
        pharmacyId,
        plan: dto.plan,
        billingCycle: dto.billingCycle,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        transactionId: dto.transactionId,
        phone: dto.phone,
        referenceCode,
        status: "PENDING",
      },
    });
  }

  async adminListPendingPayments(page = 1, limit = 20) {
    const [requests, total] = await Promise.all([
      this.prisma.paymentRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { pharmacy: { select: { id: true, name: true, city: true, email: true } } },
      }),
      this.prisma.paymentRequest.count({ where: { status: "PENDING" } }),
    ]);
    return { requests, total, page, limit };
  }

  async adminListAllPaymentRequests(page = 1, limit = 30) {
    const [requests, total] = await Promise.all([
      this.prisma.paymentRequest.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { pharmacy: { select: { id: true, name: true, city: true, email: true } } },
      }),
      this.prisma.paymentRequest.count(),
    ]);
    return { requests, total };
  }

  async adminApprovePayment(requestId: string) {
    const req = await this.prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: { pharmacy: { select: { name: true, email: true } } },
    });
    if (!req) throw new NotFoundException("Payment request not found");
    if (req.status !== "PENDING") throw new BadRequestException("This request has already been reviewed");

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (req.billingCycle === "ANNUAL" ? 12 : 1));

    const sub = await this.prisma.subscription.upsert({
      where: { pharmacyId: req.pharmacyId },
      create: {
        pharmacyId: req.pharmacyId,
        plan: req.plan,
        billingCycle: req.billingCycle,
        amount: req.amount,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: req.plan,
        billingCycle: req.billingCycle,
        amount: req.amount,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.prisma.pharmacy.update({
      where: { id: req.pharmacyId },
      data: { plan: req.plan, planExpiry: periodEnd, isActive: true },
    });

    const invoice = await this.prisma.invoice.create({
      data: {
        subscriptionId: sub.id,
        pharmacyId: req.pharmacyId,
        invoiceNo: `INV-${Date.now()}`,
        amount: req.amount,
        status: "PAID",
        dueDate: now,
        paidAt: now,
        notes: `${req.paymentMethod} | Ref: ${req.transactionId}`,
      },
    });

    await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedAt: now },
    });

    return { subscription: sub, invoice, message: `${req.plan} plan activated for ${req.pharmacy.name}.` };
  }

  async adminRejectPayment(requestId: string, reason?: string) {
    const req = await this.prisma.paymentRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Payment request not found");
    if (req.status !== "PENDING") throw new BadRequestException("This request has already been reviewed");

    return this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", rejectionReason: reason, reviewedAt: new Date() },
    });
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

  async adminListPharmaciesWithBilling(page = 1, limit = 30, search = "") {
    const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
    const [pharmacies, total] = await Promise.all([
      this.prisma.pharmacy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, city: true, plan: true, isActive: true, planExpiry: true,
          subscription: {
            select: { id: true, status: true, billingCycle: true, amount: true, currentPeriodEnd: true,
              invoices: { orderBy: { createdAt: "desc" }, take: 1, select: { paidAt: true, amount: true } }
            }
          },
        },
      }),
      this.prisma.pharmacy.count({ where }),
    ]);
    return { pharmacies, total, page, limit };
  }

  async adminAssignPlan(pharmacyId: string, dto: {
    plan: Plan;
    billingCycle: "MONTHLY" | "ANNUAL";
    amount: number;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  }) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (dto.billingCycle === "ANNUAL" ? 12 : 1));

    const sub = await this.prisma.subscription.upsert({
      where: { pharmacyId },
      create: {
        pharmacyId,
        plan: dto.plan,
        billingCycle: dto.billingCycle,
        amount: dto.amount,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: dto.plan,
        billingCycle: dto.billingCycle,
        amount: dto.amount,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: { plan: dto.plan, planExpiry: periodEnd, isActive: true },
    });

    const noteParts = [
      dto.paymentMethod ? PAYMENT_METHOD_LABELS[dto.paymentMethod] ?? dto.paymentMethod : null,
      dto.reference ? `Ref: ${dto.reference}` : null,
      dto.notes ?? null,
    ].filter(Boolean);

    const invoice = await this.prisma.invoice.create({
      data: {
        subscriptionId: sub.id,
        pharmacyId,
        invoiceNo: `INV-${Date.now()}`,
        amount: dto.amount,
        status: "PAID",
        dueDate: now,
        paidAt: now,
        notes: noteParts.join(" | ") || "Admin-assigned plan",
      },
    });

    return { subscription: sub, invoice, message: `${dto.plan} plan activated for pharmacy.` };
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

  // ── EVC Plus gateway payment ───────────────────────────────────────────────

  async payWithEvc(pharmacyId: string, dto: {
    phone: string;
    plan: Plan;
    billingCycle: "MONTHLY" | "ANNUAL";
    method?: "EVC_PLUS" | "ZAAD" | "SAHAL";
  }) {
    const cycle = dto.billingCycle ?? "MONTHLY";
    const plan = dto.plan ?? "STARTER";
    const amount = cycle === "ANNUAL" ? PLAN_PRICES[plan] * 10 : PLAN_PRICES[plan];

    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { name: true },
    });

    const referenceId = `DAWO-${pharmacyId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const result = await this.waafi.initiate({
      phone: dto.phone,
      amount,
      description: `DawoLink ${plan} plan (${cycle}) — ${pharmacy?.name ?? pharmacyId}`,
      referenceId,
      method: dto.method ?? "EVC_PLUS",
    });

    if (result.success) {
      // Auto-activate subscription
      await this.submitPayment(pharmacyId, {
        method: (dto.method ?? "EVC_PLUS") as any,
        reference: result.transactionId ?? referenceId,
        amount,
        plan,
        billingCycle: cycle,
      });
    }

    return { ...result, amount, plan, billingCycle: cycle, referenceId };
  }
}
