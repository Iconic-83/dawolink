import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AnalyticsService } from "./analytics.service";

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/analytics")
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get("dashboard")
  getDashboard(@Req() req: any) {
    return this.analytics.getPharmacyDashboard(req.user.pharmacyId);
  }

  @Get("revenue-trend")
  @ApiQuery({ name: "days", required: false, type: Number })
  getRevenueTrend(@Req() req: any, @Query("days") days?: number) {
    return this.analytics.getRevenueTrend(req.user.pharmacyId, days ? Number(days) : 30);
  }

  @Get("branches/:branchId/top-medicines")
  @ApiQuery({ name: "limit", required: false, type: Number })
  getTopMedicines(@Param("branchId") branchId: string, @Query("limit") limit?: number) {
    return this.analytics.getTopMedicines(branchId, limit ? Number(limit) : 10);
  }

  @Get("branches")
  getBranchComparison(@Req() req: any) {
    return this.analytics.getBranchComparison(req.user.pharmacyId);
  }
}
