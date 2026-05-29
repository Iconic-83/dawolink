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

  async getBranchStock(branchId: string, lowStockOnly = false) {
    return this.prisma.inventoryItem.findMany({
      where: {
        branchId,
        ...(lowStockOnly && {
          quantity: { lte: this.prisma.inventoryItem.fields.reorderLevel },
        }),
      },
      include: { medicine: true, supplier: true },
      orderBy: { medicine: { name: "asc" } },
    });
  }

  async getLowStock(branchId: string) {
    const items = await this.prisma.$queryRaw<any[]>`
      SELECT i.*, m.name, m.barcode, m.category
      FROM inventory_items i
      JOIN medicines m ON i.medicine_id = m.id
      WHERE i.branch_id = ${branchId}
        AND i.quantity <= i.reorder_level
      ORDER BY (i.quantity::float / NULLIF(i.reorder_level, 0)) ASC
    `;
    return items;
  }

  async adjustStock(userId: string, pharmacyId: string, dto: StockAdjustmentDto) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.itemId },
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
    `;
    return { totalValue: Number(result[0]?.total_value ?? 0) };
  }
}
