import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { Decimal } from "@prisma/client/runtime/library";

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createTransaction(branchId: string, userId: string, pharmacyId: string, dto: CreateTransactionDto) {
    // Deduplicate offline transactions that get retried during sync
    if (dto.offlineId) {
      const existing = await this.prisma.transaction.findUnique({
        where: { offlineId: dto.offlineId },
        include: {
          items: { include: { medicine: true } },
          customer: true,
          branch: { include: { pharmacy: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      });
      if (existing) return existing;
    }

    const receiptNo = `RX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let subtotal = 0;
    const enrichedItems: any[] = [];

    for (const item of dto.items) {
      const lineDiscount = item.discount ?? 0;
      const lineTotal = item.unitPrice * item.quantity - lineDiscount;
      subtotal += lineTotal;

      enrichedItems.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: lineDiscount,
        total: lineTotal,
        batchNo: item.batchNo,
      });
    }

    const discount = dto.discount ?? 0;
    const total = subtotal - discount;
    const change = Math.max(0, dto.amountPaid - total);

    if (dto.amountPaid < total) {
      throw new BadRequestException("Insufficient payment amount");
    }

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          branchId,
          userId,
          customerId: dto.customerId,
          receiptNo,
          type: dto.type,
          paymentMethod: dto.paymentMethod,
          subtotal,
          discount,
          tax: 0,
          total,
          amountPaid: dto.amountPaid,
          change,
          notes: dto.notes,
          offlineId: dto.offlineId,
          items: { create: enrichedItems },
        },
        include: {
          items: { include: { medicine: true } },
          customer: true,
          branch: { include: { pharmacy: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      });

      // Deduct stock for each item
      for (const item of enrichedItems) {
        const stockItem = await tx.inventoryItem.findFirst({
          where: { branchId, medicineId: item.medicineId, quantity: { gte: item.quantity } },
          orderBy: { expiryDate: "asc" },
        });

        if (!stockItem) {
          throw new BadRequestException(`Insufficient stock for medicine ${item.medicineId}`);
        }

        await tx.inventoryItem.update({
          where: { id: stockItem.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return created;
    });

    this.audit.log({
      pharmacyId,
      userId,
      action: "SALE",
      entity: "Transaction",
      entityId: transaction.id,
      newValue: {
        receiptNo: transaction.receiptNo,
        total: Number(transaction.total),
        paymentMethod: transaction.paymentMethod,
        itemCount: transaction.items.length,
        offlineId: dto.offlineId,
      },
    });

    return transaction;
  }

  async getTransactions(branchId: string, params: { from?: string; to?: string; limit?: number }) {
    return this.prisma.transaction.findMany({
      where: {
        branchId,
        createdAt: {
          gte: params.from ? new Date(params.from) : undefined,
          lte: params.to ? new Date(params.to) : undefined,
        },
      },
      include: { items: { include: { medicine: true } }, user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 50,
    });
  }

  async getDailySummary(branchId: string, date?: string) {
    const day = date ? new Date(date) : new Date();
    const start = new Date(day.setHours(0, 0, 0, 0));
    const end = new Date(day.setHours(23, 59, 59, 999));

    const [transactions, totalResult] = await Promise.all([
      this.prisma.transaction.count({ where: { branchId, createdAt: { gte: start, lte: end }, status: "COMPLETED" } }),
      this.prisma.transaction.aggregate({
        where: { branchId, createdAt: { gte: start, lte: end }, status: "COMPLETED" },
        _sum: { total: true },
      }),
    ]);

    return {
      date: start.toISOString().split("T")[0],
      transactionCount: transactions,
      totalRevenue: Number(totalResult._sum.total ?? 0),
    };
  }
}
