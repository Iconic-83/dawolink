import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req, Sse, MessageEvent } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { Observable } from "rxjs";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtStreamGuard } from "./guards/jwt-stream.guard";
import { OrderService } from "./order.service";
import { NotificationsService } from "../notifications/notifications.service";

@ApiTags("Orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/orders")
export class OrderController {
  constructor(
    private orders: OrderService,
    private notifications: NotificationsService,
  ) {}

  @Get("stats")
  stats(@Req() req: any) {
    return this.orders.getStats(req.user.pharmacyId);
  }

  /** SSE endpoint — EventSource can't send headers so we accept token via ?token= */
  @Get("stream")
  @Sse()
  @UseGuards(JwtStreamGuard)
  stream(@Req() req: any): Observable<MessageEvent> {
    return this.notifications.getStream(req.user.pharmacyId);
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

  @Patch(":id/prescription/verify")
  verifyPrescription(@Req() req: any, @Param("id") id: string) {
    return this.orders.verifyPrescription(req.user.pharmacyId, id);
  }

  @Patch(":id/prescription/reject")
  rejectPrescription(@Req() req: any, @Param("id") id: string, @Body("reason") reason: string) {
    return this.orders.rejectPrescription(req.user.pharmacyId, id, reason);
  }
}
