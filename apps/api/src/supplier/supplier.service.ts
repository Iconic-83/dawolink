import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { ReceivePODto } from "./dto/receive-po.dto";

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

  async updatePOStatus(pharmacyId: string, userId: string, id: string, status: string) {
    const order = await this.prisma.purchaseOrder.findFirst({ where: { id, pharmacyId } });
    if (!order) throw new NotFoundException("Purchase order not found");
    if (order.status === "RECEIVED") throw new BadRequestException("Cannot change status of a received order");

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as any },
      include: { supplier: true, items: true },
    });

    this.audit.log({
      pharmacyId, userId,
      action: "PO_STATUS_UPDATED",
      entity: "PurchaseOrder",
      entityId: id,
      oldValue: { status: order.status },
      newValue: { status, orderNo: order.orderNo },
    });

    return updated;
  }

  async receivePO(pharmacyId: string, userId: string, id: string, dto: ReceivePODto) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, pharmacyId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Purchase order not found");
    if (order.status === "RECEIVED") throw new BadRequestException("Order already received");

    const allQtyMet = dto.items.every(ri => {
      const poItem = order.items.find(i => i.id === ri.poItemId);
      return poItem && ri.receivedQty >= poItem.quantity;
    });

    await this.prisma.$transaction(async (tx) => {
      for (const ri of dto.items) {
        await tx.inventoryItem.create({
          data: {
            branchId: dto.branchId,
            medicineId: ri.medicineId,
            supplierId: order.supplierId,
            quantity: ri.receivedQty,
            costPrice: ri.costPrice,
            sellingPrice: ri.sellingPrice,
            batchNo: ri.batchNo || null,
            expiryDate: ri.expiryDate ? new Date(ri.expiryDate) : null,
            reorderLevel: 10,
          },
        });

        await tx.pOItem.update({
          where: { id: ri.poItemId },
          data: { receivedQty: ri.receivedQty },
        });
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: allQtyMet ? "RECEIVED" : "PARTIALLY_RECEIVED",
          receivedAt: new Date(),
        },
      });
    });

    this.audit.log({
      pharmacyId, userId,
      action: "PO_RECEIVED",
      entity: "PurchaseOrder",
      entityId: id,
      newValue: {
        orderNo: order.orderNo,
        itemCount: dto.items.length,
        branchId: dto.branchId,
        fullyReceived: allQtyMet,
      },
    });

    return { success: true, fullyReceived: allQtyMet };
  }
}
