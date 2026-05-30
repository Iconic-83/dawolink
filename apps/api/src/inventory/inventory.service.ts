import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateInventoryItemDto } from "./dto/create-inventory-item.dto";
import { StockAdjustmentDto } from "./dto/stock-adjustment.dto";

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async addItem(branchId: string, userId: string, pharmacyId: string, dto: CreateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.create({
      data: {
        ...dto,
        branchId,
        supplierId: dto.supplierId || null,
        batchNo: dto.batchNo || null,
        location: dto.location || null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
      include: { medicine: true },
    });

    this.audit.log({
      pharmacyId,
      userId,
      action: "STOCK_ADDED",
      entity: "InventoryItem",
      entityId: item.id,
      newValue: { medicineName: item.medicine?.name, quantity: dto.quantity, branchId },
    });

    return item;
  }

  // Dedicated POS lookup — gets best inventory item for a medicine in a branch
  async getPosStock(branchId: string, medicineId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { branchId, medicineId, deletedAt: null, quantity: { gt: 0 } },
      include: { medicine: true },
      orderBy: { expiryDate: "asc" }, // earliest expiry first (FEFO)
    });
    // Fallback: include out-of-stock items so POS can still show the medicine
    if (!item) {
      const any = await this.prisma.inventoryItem.findFirst({
        where: { branchId, medicineId, deletedAt: null },
        include: { medicine: true },
        orderBy: { createdAt: "desc" },
      });
      return any ?? null;
    }
    return item;
  }

  async getBranchStock(
    branchId: string,
    opts: { lowStockOnly?: boolean; search?: string; medicineId?: string; page?: number; limit?: number } = {},
  ) {
    const { lowStockOnly = false, search, medicineId, page = 1, limit = 50 } = opts;
    const skip = (page - 1) * limit;

    const where: any = {
      branchId,
      deletedAt: null,
      ...(medicineId && { medicineId }),
      ...(lowStockOnly && { quantity: { lte: this.prisma.inventoryItem.fields.reorderLevel } }),
      ...(search && { medicine: { name: { contains: search, mode: "insensitive" } } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        include: { medicine: true, supplier: true },
        orderBy: { medicine: { name: "asc" } },
        skip,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getLowStock(branchId: string) {
    const items = await this.prisma.$queryRaw<any[]>`
      SELECT i.*, m.name, m.barcode, m.category
      FROM inventory_items i
      JOIN medicines m ON i.medicine_id = m.id
      WHERE i.branch_id = ${branchId}
        AND i.quantity <= i.reorder_level
        AND i."deletedAt" IS NULL
        AND m."deletedAt" IS NULL
      ORDER BY (i.quantity::float / NULLIF(i.reorder_level, 0)) ASC
    `;
    return items;
  }

  async adjustStock(userId: string, pharmacyId: string, dto: StockAdjustmentDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: dto.itemId, deletedAt: null },
      include: { medicine: true },
    });
    if (!item) throw new NotFoundException("Inventory item not found");

    const newQty = item.quantity + dto.adjustment;
    if (newQty < 0) throw new BadRequestException("Stock cannot go below zero");

    const updated = await this.prisma.inventoryItem.update({
      where: { id: dto.itemId },
      data: { quantity: newQty },
    });

    this.audit.log({
      pharmacyId,
      userId,
      action: "STOCK_ADJUSTED",
      entity: "InventoryItem",
      entityId: item.id,
      oldValue: { quantity: item.quantity },
      newValue: { quantity: newQty, adjustment: dto.adjustment, medicineName: item.medicine?.name },
    });

    return updated;
  }

  async getStockValue(branchId: string) {
    const result = await this.prisma.$queryRaw<{ total_value: number }[]>`
      SELECT SUM(quantity * selling_price) as total_value
      FROM inventory_items
      WHERE branch_id = ${branchId}
        AND "deletedAt" IS NULL
    `;
    return { totalValue: Number(result[0]?.total_value ?? 0) };
  }
}
