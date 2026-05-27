import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ExpiryService } from "./expiry.service";

@ApiTags("Expiry")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/expiry")
export class ExpiryController {
  constructor(private expiry: ExpiryService) {}

  @Get("alerts")
  getAlerts(@Req() req: any) {
    return this.expiry.getExpiryAlerts(req.user.pharmacyId);
  }

  @Get("branches/:branchId/dashboard")
  getDashboard(@Param("branchId") branchId: string) {
    return this.expiry.getExpiryDashboard(branchId);
  }

  @Get("branches/:branchId/expiring")
  @ApiQuery({ name: "days", required: false, type: Number })
  getExpiringSoon(@Param("branchId") branchId: string, @Query("days") days?: number) {
    return this.expiry.getExpiringSoon(branchId, days ? Number(days) : 90);
  }

  @Get("branches/:branchId/expired")
  getExpired(@Param("branchId") branchId: string) {
    return this.expiry.getExpired(branchId);
  }
}
