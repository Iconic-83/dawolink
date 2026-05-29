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
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
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

  // Supplier detail: history, spend, debt, avg delivery time
  async getSupplierSummary(pharmacyId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, pharmacyId } });
    if (!supplier) throw new NotFoundException("Supplier not found");

    const orders = await this.prisma.purchaseOrder.findMany({
      where: { supplierId, pharmacyId },
      include: { items: true },
      orderBy: { orderedAt: "desc" },
    });

    const received = orders.filter(o => o.status === "RECEIVED" || o.status === "PARTIALLY_RECEIVED");
    const totalSpend = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const totalDebt = orders
      .filter(o => o.paymentStatus !== "PAID")
      .reduce((s, o) => s + (Number(o.totalAmount) - Number(o.amountPaid)), 0);

    const deliveryTimes = received
      .filter(o => o.receivedAt && o.orderedAt)
      .map(o => (o.receivedAt!.getTime() - o.orderedAt.getTime()) / (1000 * 60 * 60 * 24));
    const avgDeliveryDays = deliveryTimes.length
      ? Math.round(deliveryTimes.reduce((s, d) => s + d, 0) / deliveryTimes.length)
      : null;

    return {
      supplier,
      stats: {
        totalOrders: orders.length,
        receivedOrders: received.length,
        totalSpend,
        totalDebt,
        avgDeliveryDays,
        fulfillmentRate: orders.length ? Math.round((received.length / orders.length) * 100) : 0,
      },
      recentOrders: orders.slice(0, 10),
    };
  }

  // Debt summary across all suppliers
  async getDebtSummary(pharmacyId: string) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { pharmacyId, paymentStatus: { not: "PAID" }, status: { in: ["RECEIVED", "PARTIALLY_RECEIVED", "CONFIRMED"] } },
      include: { supplier: true },
      orderBy: { orderedAt: "asc" },
    });

    const bySupplier = orders.reduce((acc: Record<string, any>, o) => {
      const sid = o.supplierId;
      if (!acc[sid]) {
        acc[sid] = { supplier: o.supplier, totalDebt: 0, orders: [] };
      }
      acc[sid].totalDebt += Number(o.totalAmount) - Number(o.amountPaid);
      acc[sid].orders.push(o);
      return acc;
    }, {});

    return Object.values(bySupplier).sort((a: any, b: any) => b.totalDebt - a.totalDebt);
  }

  // Record payment against a PO
  async recordPayment(pharmacyId: string, userId: string, orderId: string, amount: number, invoiceNo?: string) {
    const order = await this.prisma.purchaseOrder.findFirst({ where: { id: orderId, pharmacyId } });
    if (!order) throw new NotFoundException("Purchase order not found");

    const newPaid = Number(order.amountPaid) + amount;
    const total = Number(order.totalAmount);
    const paymentStatus = newPaid >= total ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        amountPaid: newPaid,
        paymentStatus: paymentStatus as any,
        paidAt: paymentStatus === "PAID" ? new Date() : undefined,
        supplierInvoiceNo: invoiceNo || order.supplierInvoiceNo,
      },
      include: { supplier: true, items: true },
    });

    this.audit.log({
      pharmacyId, userId,
      action: "PAYMENT_RECORDED",
      entity: "PurchaseOrder",
      entityId: orderId,
      newValue: { amount, paymentStatus, orderNo: order.orderNo, totalPaid: newPaid },
    });

    return updated;
  }

  // Reorder suggestions: low-stock items + best supplier from history
  async getReorderSuggestions(pharmacyId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      select: { id: true },
    });
    const branchIds = branches.map(b => b.id);

    const lowStockItems = await this.prisma.inventoryItem.findMany({
      where: {
        branchId: { in: branchIds },
        quantity: { lte: this.prisma.inventoryItem.fields.reorderLevel },
      },
      include: { medicine: true, supplier: true },
      orderBy: { quantity: "asc" },
      take: 20,
    });

    // For each low-stock item, find the best supplier from order history
    const suggestions = await Promise.all(
      lowStockItems.map(async (item) => {
        const lastOrder = await this.prisma.purchaseOrder.findFirst({
          where: {
            pharmacyId,
            status: "RECEIVED",
            items: { some: { medicineName: { contains: item.medicine?.name ?? "", mode: "insensitive" } } },
          },
          include: { supplier: true, items: true },
          orderBy: { receivedAt: "desc" },
        });

        return {
          medicine: item.medicine,
          currentStock: item.quantity,
          reorderLevel: item.reorderLevel,
          branch: item.branchId,
          suggestedQty: Math.max(item.reorderLevel * 3, 100),
          lastSupplier: lastOrder?.supplier ?? item.supplier,
          lastOrderedAt: lastOrder?.orderedAt,
          lastUnitCost: lastOrder?.items?.[0] ? Number(lastOrder.items[0].unitCost) : null,
        };
      })
    );

    return suggestions.filter(s => s.medicine);
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

    const newMedicinesCreated: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const ri of dto.items) {
        // Resolve medicineId — use existing or create inline (PENDING_VERIFICATION)
        let medicineId = ri.medicineId;

        if (!medicineId && ri.newMedicine) {
          const created = await tx.medicine.create({
            data: {
              ...ri.newMedicine,
              pharmacyId,
              verificationStatus: "PENDING_VERIFICATION",
            },
          });
          medicineId = created.id;
          newMedicinesCreated.push(created.name);
        }

        if (!medicineId) throw new BadRequestException("Each item must have medicineId or newMedicine");

        const existing = await tx.inventoryItem.findFirst({
          where: { branchId: dto.branchId, medicineId },
        });

        if (existing) {
          await tx.inventoryItem.update({
            where: { id: existing.id },
            data: {
              quantity: { increment: ri.receivedQty },
              costPrice: ri.costPrice,
              sellingPrice: ri.sellingPrice,
              supplierId: order.supplierId,
              batchNo: ri.batchNo || existing.batchNo,
              expiryDate: ri.expiryDate ? new Date(ri.expiryDate) : existing.expiryDate,
            },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              branchId: dto.branchId,
              medicineId,
              supplierId: order.supplierId,
              quantity: ri.receivedQty,
              costPrice: ri.costPrice,
              sellingPrice: ri.sellingPrice,
              batchNo: ri.batchNo || null,
              expiryDate: ri.expiryDate ? new Date(ri.expiryDate) : null,
              reorderLevel: 10,
            },
          });
        }

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
        newMedicinesCreated,
      },
    });

    return { success: true, fullyReceived: allQtyMet, newMedicinesCreated };
  }
}
