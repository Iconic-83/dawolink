import { Controller, Get, Patch, Post, Body, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DriverService } from "./driver.service";

@ApiTags("Driver")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/driver")
export class DriverController {
  constructor(private driver: DriverService) {}

  // ── Driver endpoints (role: DELIVERY_DRIVER) ──────────────────────────────

  @Get("deliveries")
  @ApiOperation({ summary: "Get active deliveries assigned to me" })
  myDeliveries(@Req() req: any) {
    return this.driver.getMyDeliveries(req.user.id);
  }

  @Get("deliveries/history")
  @ApiOperation({ summary: "Get past delivery history" })
  history(@Req() req: any) {
    return this.driver.getDeliveryHistory(req.user.id);
  }

  @Patch("deliveries/:id/accept")
  @ApiOperation({ summary: "Accept delivery (READY_FOR_PICKUP → OUT_FOR_DELIVERY)" })
  accept(@Req() req: any, @Param("id") id: string) {
    return this.driver.acceptDelivery(req.user.id, id);
  }

  @Patch("deliveries/:id/status")
  @ApiOperation({ summary: "Update delivery status (driver)" })
  updateStatus(@Req() req: any, @Param("id") id: string, @Body("status") status: string) {
    return this.driver.updateStatus(req.user.id, id, status);
  }

  // ── Pharmacy endpoints (assign driver, list drivers) ──────────────────────

  @Get("pharmacy/drivers")
  @ApiOperation({ summary: "List available delivery drivers for pharmacy" })
  listDrivers(@Req() req: any) {
    return this.driver.getDrivers(req.user.pharmacyId);
  }

  @Patch("pharmacy/orders/:id/assign")
  @ApiOperation({ summary: "Assign a driver to an order" })
  assign(
    @Req() req: any,
    @Param("id") id: string,
    @Body("driverId") driverId: string,
  ) {
    return this.driver.assignDriver(req.user.pharmacyId, id, driverId);
  }
}
