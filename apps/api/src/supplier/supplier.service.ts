import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  create(pharmacyId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: { ...dto, pharmacyId } });
  }

  findAll(pharmacyId: string) {
    return this.prisma.supplier.findMany({
      where: { pharmacyId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async findOne(pharmacyId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, pharmacyId } });
    if (!supplier) throw new NotFoundException("Supplier not found");
    return supplier;
  }

  async createPurchaseOrder(pharmacyId: string, dto: CreatePurchaseOrderDto) {
    const orderNo = `PO-${Date.now()}`;
    const total = dto.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

    return this.prisma.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        pharmacyId,
        orderNo,
        totalAmount: total,
        notes: dto.notes,
        items: { create: dto.items },
      },
      include: { items: true, supplier: true },
    });
  }

  getPurchaseOrders(pharmacyId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { pharmacyId },
      include: { supplier: true, items: true },
      orderBy: { orderedAt: "desc" },
    });
  }
}
