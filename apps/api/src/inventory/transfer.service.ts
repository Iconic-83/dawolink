import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { InboxService } from "../inbox/inbox.service";

export interface CreateTransferDto {
  fromBranchId: string;
  toBranchId: string;
  notes?: string;
  items: { medicineId: string; quantity: number; batchNo?: string }[];
}

@Injectable()
export class TransferService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private inbox: InboxService,
  ) {}

  async create(pharmacyId: string, userId: string, dto: CreateTransferDto) {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException("Source and destination branch must be different");
    }

    // Verify both branches belong to this pharmacy
    const [from, to] = await Promise.all([
      this.prisma.branch.findFirst({ where: { id: dto.fromBranchId, pharmacyId, isActive: true } }),
      this.prisma.branch.findFirst({ where: { id: dto.toBranchId, pharmacyId, isActive: true } }),
    ]);
    if (!from) throw new NotFoundException("Source branch not found");
    if (!to) throw new NotFoundException("Destination branch not found");

    // Validate stock availability in source branch
    for (const item of dto.items) {
      const stock = await this.prisma.inventoryItem.findFirst({
        where: { branchId: dto.fromBranchId, medicineId: item.medicineId, deletedAt: null },
      });
      if (!stock) throw new BadRequestException(`Medicine ${item.medicineId} not found in source branch`);
      if (stock.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for medicine ${item.medicineId}: have ${stock.quantity}, requested ${item.quantity}`,
        );
      }
    }

    const transferNo = `TRF-${Date.now().toString(36).toUpperCase()}`;

    const transfer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.stockTransfer.create({
        data: {
          fromBranchId: dto.fromBranchId,
          toBranchId: dto.toBranchId,
          transferNo,
          notes: dto.notes,
          items: {
            create: dto.items.map(i => ({
              medicineName: i.medicineId, // will enrich below
              quantity: i.quantity,
              batchNo: i.batchNo,
            })),
          },
        },
        include: {
          items: true,
          fromBranch: { select: { name: true } },
          toBranch: { select: { name: true } },
        },
      });

      // Move stock immediately (PENDING → COMPLETED in one step for now)
      for (const item of dto.items) {
        // Deduct from source
        const fromStock = await tx.inventoryItem.findFirst({
          where: { branchId: dto.fromBranchId, medicineId: item.medicineId, deletedAt: null },
          include: { medicine: true },
        });
        await tx.inventoryItem.update({
          where: { id: fromStock!.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Add to destination (upsert)
        const toStock = await tx.inventoryItem.findFirst({
          where: { branchId: dto.toBranchId, medicineId: item.medicineId, deletedAt: null },
        });

        if (toStock) {
          await tx.inventoryItem.update({
            where: { id: toStock.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              branchId: dto.toBranchId,
              medicineId: item.medicineId,
              supplierId: fromStock!.supplierId,
              quantity: item.quantity,
              reorderLevel: fromStock!.reorderLevel,
              costPrice: fromStock!.costPrice,
              sellingPrice: fromStock!.sellingPrice,
              batchNo: item.batchNo ?? fromStock!.batchNo,
              expiryDate: fromStock!.expiryDate,
            },
          });
        }

        // Update transfer item with real medicine name
        await tx.transferItem.updateMany({
          where: { transferId: created.id, medicineName: item.medicineId },
          data: { medicineName: fromStock!.medicine?.name ?? item.medicineId },
        });
      }

      await tx.stockTransfer.update({
        where: { id: created.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      return created;
    });

    this.audit.log({
      pharmacyId,
      userId,
      action: "STOCK_TRANSFERRED",
      entity: "StockTransfer",
      entityId: transfer.id,
      newValue: {
        transferNo,
        from: from.name,
        to: to.name,
        itemCount: dto.items.length,
        items: dto.items.map(i => ({ medicineId: i.medicineId, quantity: i.quantity })),
      },
    });

    this.inbox.push(
      pharmacyId,
      "STOCK_TRANSFER",
      "Stock Transfer Completed",
      `${dto.items.length} item${dto.items.length === 1 ? "" : "s"} transferred from ${from.name} to ${to.name}.`,
      "/transfers",
    );

    return this.getOne(pharmacyId, transfer.id);
  }

  getAll(pharmacyId: string) {
    return this.prisma.stockTransfer.findMany({
      where: {
        OR: [
          { fromBranch: { pharmacyId } },
          { toBranch: { pharmacyId } },
        ],
      },
      include: {
        items: true,
        fromBranch: { select: { id: true, name: true } },
        toBranch: { select: { id: true, name: true } },
      },
      orderBy: { requestedAt: "desc" },
      take: 100,
    });
  }

  async getOne(pharmacyId: string, id: string) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: {
        id,
        OR: [
          { fromBranch: { pharmacyId } },
          { toBranch: { pharmacyId } },
        ],
      },
      include: {
        items: true,
        fromBranch: { select: { id: true, name: true } },
        toBranch: { select: { id: true, name: true } },
      },
    });
    if (!transfer) throw new NotFoundException("Transfer not found");
    return transfer;
  }
}
