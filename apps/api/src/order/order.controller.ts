import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrderService } from "./order.service";

@ApiTags("Orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/orders")
export class OrderController {
  constructor(private orders: OrderService) {}

  @Get("stats")
  stats(@Req() req: any) {
    return this.orders.getStats(req.user.pharmacyId);
  }

  @Get()
  @ApiQuery({ name: "status", required: false })
  list(@Req() req: any, @Query("status") status?: string) {
    return this.orders.getOrders(req.user.pharmacyId, status);
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.orders.getOrder(req.user.pharmacyId, id);
  }

  @Patch(":id/status")
  updateStatus(@Req() req: any, @Param("id") id: string, @Body("status") status: string) {
    return this.orders.updateStatus(req.user.pharmacyId, id, status);
  }
}
