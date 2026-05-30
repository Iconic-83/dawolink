import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CustomerGuard } from "../marketplace/guards/customer.guard";
import { InsuranceService } from "./insurance.service";

@ApiTags("Insurance")
@Controller({ path: "insurance", version: "1" })
export class InsuranceController {
  constructor(private readonly svc: InsuranceService) {}

  @Get("companies")
  getCompanies() {
    return this.svc.getCompanies();
  }

  @Post("companies")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createCompany(@Body() dto: { name: string; code: string; contactEmail?: string }) {
    return this.svc.createCompany(dto);
  }

  // ── Customer claims ───────────────────────────────────────────────────────
  @Post("claims")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  submitClaim(@Req() req: any, @Body() dto: {
    orderId: string; insuranceCompanyId: string; memberId: string; requestedAmount: number;
  }) {
    return this.svc.submitClaim(req.user.id, dto);
  }

  @Get("claims/mine")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  myClaims(@Req() req: any) {
    return this.svc.getMyClaims(req.user.id);
  }

  // ── Admin / pharmacy staff ─────────────────────────────────────────────────
  @Get("claims")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  allClaims(@Query("status") status?: string) {
    return this.svc.getAllClaims(status);
  }

  @Get("claims/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  stats() {
    return this.svc.getClaimStats();
  }

  @Patch("claims/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  processClaim(
    @Param("id") id: string,
    @Body() dto: { status: "APPROVED" | "REJECTED"; approvedAmount?: number; rejectionReason?: string },
  ) {
    return this.svc.processClaim(id, dto);
  }
}
