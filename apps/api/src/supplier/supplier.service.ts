import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";

@Injectable()
export class SupplierService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(pharmacyId: string, userId: string, dto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({ data: { ...dto, pharmacyId } });

    this.audit.log({
      pharmacyId,
      userId,
      action: "SUPPLIER_CREATED",
      entity: "Supplier",
      entityId: supplier.id,
      newValue: { name: supplier.name, contactName: supplier.contactName },
    });

    return supplier;
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

  async createPurchaseOrder(pharmacyId: string, userId: string, dto: CreatePurchaseOrderDto) {
    const orderNo = `PO-${Date.now()}`;
    const total = dto.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

    const order = await this.prisma.purchaseOrder.create({
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

    this.audit.log({
      pharmacyId,
      userId,
      action: "PURCHASE_ORDER_CREATED",
      entity: "PurchaseOrder",
      entityId: order.id,
      newValue: { orderNo, totalAmount: total, supplierName: order.supplier?.name, itemCount: dto.items.length },
    });

    return order;
  }

  getPurchaseOrders(pharmacyId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { pharmacyId },
      include: { supplier: true, items: true },
      orderBy: { orderedAt: "desc" },
    });
  }
}
