import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { NationalService } from "./national.service";

@ApiTags("National Intelligence")
@Controller({ path: "national", version: "1" })
export class NationalController {
  constructor(private readonly svc: NationalService) {}

  // ── Public endpoints ──────────────────────────────────────────────────────

  @Get("prices")
  priceIntelligence(@Query("medicine") medicine?: string) {
    return this.svc.getPriceIntelligence(medicine);
  }

  @Get("recalls")
  getRecalls(@Query("all") all?: string) {
    return this.svc.getRecalls(all !== "true");
  }

  // ── Authenticated (admin/owner) endpoints ─────────────────────────────────

  @Get("shortage")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  shortage() {
    return this.svc.getShortageReport();
  }

  @Get("trends")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  trends(@Query("days") days?: string) {
    return this.svc.getDiseaseTrends(days ? Number(days) : 30);
  }

  @Post("recalls")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createRecall(
    @Body() dto: {
      medicineName: string;
      batchNumber?: string;
      manufacturer?: string;
      reason: string;
      severity: "LOW" | "HIGH" | "CRITICAL";
    },
  ) {
    return this.svc.createRecall(dto);
  }

  @Patch("recalls/:id/resolve")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  resolveRecall(@Param("id") id: string) {
    return this.svc.resolveRecall(id);
  }
}
