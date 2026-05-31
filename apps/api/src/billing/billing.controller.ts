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
  @ApiOperation({ summary: "Submit manual reference payment to activate subscription" })
  submitPayment(@Req() req: any, @Body() dto: SubmitPaymentDto) {
    return this.billing.submitPayment(req.user.pharmacyId, dto);
  }

  @Post("pay/evc")
  @ApiOperation({ summary: "Initiate EVC Plus / Zaad / Sahal push payment and auto-activate on success" })
  payWithEvc(
    @Req() req: any,
    @Body() body: { phone: string; plan: any; billingCycle: any; method?: any },
  ) {
    return this.billing.payWithEvc(req.user.pharmacyId, body);
  }

  @Post("pay/request")
  @ApiOperation({ summary: "Submit payment proof — awaits admin approval before activating" })
  submitPaymentRequest(
    @Req() req: any,
    @Body() body: { plan: any; billingCycle: any; amount: number; paymentMethod: string; transactionId: string; phone?: string; referenceCode?: string },
  ) {
    return this.billing.submitPaymentRequest(req.user.pharmacyId, body);
  }

  @Get("plans")
  @ApiOperation({ summary: "Get available plans and pricing" })
  getPlans() {
    return this.billing.getPlansInfo();
  }

  @Get("usage")
  @ApiOperation({ summary: "Current plan usage vs limits" })
  usage(@Req() req: any) {
    return this.billing.getPlanUsage(req.user.pharmacyId);
  }

  @Get("invoices")
  @ApiOperation({ summary: "Paginated invoice history" })
  listInvoices(
    @Req() req: any,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.billing.listInvoices(req.user.pharmacyId, +page, +limit);
  }

  @Get("invoices/:id")
  @ApiOperation({ summary: "Invoice detail for printing" })
  getInvoice(@Req() req: any, @Param("id") id: string) {
    return this.billing.getInvoice(req.user.pharmacyId, id);
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

  @Get("admin/pharmacies")
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: "List all pharmacies with subscription status (admin)" })
  listPharmaciesWithBilling(
    @Query("page") page = "1",
    @Query("limit") limit = "30",
    @Query("search") search = "",
  ) {
    return this.billing.adminListPharmaciesWithBilling(+page, +limit, search);
  }

  @Post("admin/pharmacies/:id/assign-plan")
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: "Assign plan to pharmacy after receiving payment (admin)" })
  assignPlan(
    @Param("id") pharmacyId: string,
    @Body() body: { plan: any; billingCycle: "MONTHLY" | "ANNUAL"; amount: number; paymentMethod?: string; reference?: string; notes?: string },
  ) {
    return this.billing.adminAssignPlan(pharmacyId, body);
  }

  @Get("admin/pending-payments")
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: "List pending payment requests awaiting approval" })
  listPendingPayments(@Query("page") page = "1", @Query("limit") limit = "20") {
    return this.billing.adminListPendingPayments(+page, +limit);
  }

  @Get("admin/all-payment-requests")
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: "List all payment requests (admin)" })
  listAllPaymentRequests(@Query("page") page = "1", @Query("limit") limit = "30") {
    return this.billing.adminListAllPaymentRequests(+page, +limit);
  }

  @Post("admin/payments/:id/approve")
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: "Approve a pending payment request" })
  approvePayment(@Param("id") id: string) {
    return this.billing.adminApprovePayment(id);
  }

  @Post("admin/payments/:id/reject")
  @UseGuards(PlatformAdminGuard)
  @ApiOperation({ summary: "Reject a pending payment request" })
  rejectPayment(@Param("id") id: string, @Body() body: { reason?: string }) {
    return this.billing.adminRejectPayment(id, body.reason);
  }
}
