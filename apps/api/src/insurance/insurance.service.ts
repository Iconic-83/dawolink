import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";

@Injectable()
export class InsuranceService {
  constructor(private prisma: PrismaService) {}

  // ── Companies ─────────────────────────────────────────────────────────────
  async getCompanies() {
    return this.prisma.insuranceCompany.findMany({ where: { isActive: true } });
  }

  async createCompany(dto: { name: string; code: string; contactEmail?: string }) {
    return this.prisma.insuranceCompany.create({ data: dto });
  }

  // ── Claims ────────────────────────────────────────────────────────────────
  async submitClaim(appUserId: string, dto: {
    orderId: string;
    insuranceCompanyId: string;
    memberId: string;
    requestedAmount: number;
  }) {
    const order = await this.prisma.medicineOrder.findFirst({
      where: { id: dto.orderId, appUserId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== "DELIVERED") throw new BadRequestException("Can only claim for delivered orders");

    const existing = await this.prisma.insuranceClaim.findFirst({
      where: { orderId: dto.orderId },
    });
    if (existing) throw new BadRequestException("A claim already exists for this order");

    return this.prisma.insuranceClaim.create({
      data: {
        appUserId,
        orderId: dto.orderId,
        insuranceCompanyId: dto.insuranceCompanyId,
        memberId: dto.memberId,
        requestedAmount: dto.requestedAmount,
      },
      include: { insuranceCompany: true, order: true },
    });
  }

  async getMyClaims(appUserId: string) {
    return this.prisma.insuranceClaim.findMany({
      where: { appUserId },
      include: { insuranceCompany: true, order: { select: { orderNo: true, total: true } } },
      orderBy: { submittedAt: "desc" },
    });
  }

  async getAllClaims(status?: string) {
    return this.prisma.insuranceClaim.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        insuranceCompany: true,
        appUser: { select: { name: true, phone: true } },
        order: { select: { orderNo: true, total: true } },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  async processClaim(id: string, dto: {
    status: "APPROVED" | "REJECTED";
    approvedAmount?: number;
    rejectionReason?: string;
  }) {
    const claim = await this.prisma.insuranceClaim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException("Claim not found");
    if (claim.status !== "PENDING" && claim.status !== "PROCESSING") {
      throw new BadRequestException("Claim already processed");
    }

    return this.prisma.insuranceClaim.update({
      where: { id },
      data: {
        status: dto.status,
        approvedAmount: dto.approvedAmount,
        rejectionReason: dto.rejectionReason,
        processedAt: new Date(),
      },
      include: { insuranceCompany: true },
    });
  }

  async getClaimStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.insuranceClaim.count(),
      this.prisma.insuranceClaim.count({ where: { status: "PENDING" } }),
      this.prisma.insuranceClaim.count({ where: { status: "APPROVED" } }),
      this.prisma.insuranceClaim.count({ where: { status: "REJECTED" } }),
    ]);
    const approvedSum = await this.prisma.insuranceClaim.aggregate({
      where: { status: "APPROVED" },
      _sum: { approvedAmount: true },
    });
    return {
      total, pending, approved, rejected,
      totalApprovedAmount: Number(approvedSum._sum.approvedAmount ?? 0),
    };
  }
}
