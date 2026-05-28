import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../platform/guards/platform-admin.guard";
import { BillingService } from "./billing.service";
import { SubmitPaymentDto } from "./billing.dto";

@ApiTags("Billing")
@Controller("v1/billing")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private billing: BillingService) {}

  // Pharmacy: view own subscription
  @Get("subscription")
  @ApiOperation({ summary: "Get current pharmacy subscription" })
  getSubscription(@Req() req: any) {
    return this.billing.getSubscription(req.user.pharmacyId);
  }

  @Post("subscription")
  @ApiOperation({ summary: "Create or update subscription" })
  createSubscription(@Req() req: any, @Body() body: { plan: any; billingCycle?: "MONTHLY" | "ANNUAL" }) {
    return this.billing.createSubscription(req.user.pharmacyId, body.plan, body.billingCycle);
  }

  @Patch("subscription/cancel")
  @ApiOperation({ summary: "Cancel subscription" })
  cancel(@Req() req: any) {
    return this.billing.cancelSubscription(req.user.pharmacyId);
  }

  @Post("pay")
  @ApiOperation({ summary: "Submit EVC/Zaad/Sahal payment to activate or upgrade subscription" })
  submitPayment(@Req() req: any, @Body() dto: SubmitPaymentDto) {
    return this.billing.submitPayment(req.user.pharmacyId, dto);
  }

  @Get("plans")
  @ApiOperation({ summary: "Get available plans and pricing" })
  getPlans() {
    return this.billing.getPlansInfo();
  }

  // Platform admin billing
  @Get("admin/overview")
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: "Platform billing overview (admin)" })
  overview() {
    return this.billing.getPlatformBillingOverview();
  }

  @Get("admin/subscriptions")
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: "List all subscriptions (admin)" })
  listSubscriptions(@Query("page") page = "1", @Query("limit") limit = "20") {
    return this.billing.listPharmacySubscriptions(+page, +limit);
  }

  @Post("admin/pharmacies/:id/payment")
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: "Record manual payment for pharmacy (admin)" })
  recordPayment(@Param("id") pharmacyId: string, @Body() body: { amount: number; notes?: string }) {
    return this.billing.recordPayment(pharmacyId, body.amount, body.notes);
  }
}
