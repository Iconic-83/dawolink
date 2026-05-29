import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SupplierService } from "./supplier.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";

@ApiTags("Suppliers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/suppliers")
export class SupplierController {
  constructor(private suppliers: SupplierService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateSupplierDto) {
    return this.suppliers.create(req.user.pharmacyId, req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.suppliers.findAll(req.user.pharmacyId);
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.suppliers.findOne(req.user.pharmacyId, id);
  }

  @Post("purchase-orders")
  createOrder(@Req() req: any, @Body() dto: CreatePurchaseOrderDto) {
    return this.suppliers.createPurchaseOrder(req.user.pharmacyId, req.user.id, dto);
  }

  @Get("purchase-orders/all")
  getOrders(@Req() req: any) {
    return this.suppliers.getPurchaseOrders(req.user.pharmacyId);
  }
}
