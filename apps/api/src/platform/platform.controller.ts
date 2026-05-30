import {
  Controller, Post, Get, Patch, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, Req
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "./guards/platform-admin.guard";
import { PlatformService } from "./platform.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { AdminCreatePharmacyDto } from "./dto/create-pharmacy.dto";
import { SetupDto } from "./dto/setup.dto";

@ApiTags("Platform Admin")
@Controller("v1/admin")
export class PlatformController {
  constructor(private platform: PlatformService) {}

  @Post("setup")
  @ApiOperation({ summary: "One-time platform admin setup" })
  setup(@Body() dto: SetupDto) {
    return this.platform.setup(dto);
  }

  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Platform admin login" })
  login(@Body() dto: AdminLoginDto) {
    return this.platform.login(dto);
  }

  @Get("auth/me")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Current platform admin profile" })
  me(@Req() req: any) {
    return req.user;
  }

  @Get("analytics")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Ecosystem-wide analytics" })
  analytics() {
    return this.platform.getEcosystemStats();
  }

  @Get("pharmacies")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all pharmacy tenants" })
  listPharmacies(
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @Query("search") search?: string,
  ) {
    return this.platform.listPharmacies(+page, +limit, search);
  }

  @Post("pharmacies")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new pharmacy tenant with owner account" })
  createPharmacy(@Body() dto: AdminCreatePharmacyDto) {
    return this.platform.createPharmacy(dto);
  }

  @Patch("pharmacies/:id/suspend")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Suspend a pharmacy" })
  suspend(@Param("id") id: string) {
    return this.platform.suspendPharmacy(id);
  }

  @Patch("pharmacies/:id/activate")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Activate/unsuspend a pharmacy" })
  activate(@Param("id") id: string) {
    return this.platform.activatePharmacy(id);
  }

  @Patch("pharmacies/:id/plan")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update pharmacy plan" })
  updatePlan(@Param("id") id: string, @Body() body: { plan: string; planExpiry?: string }) {
    return this.platform.updatePlan(id, body.plan, body.planExpiry ? new Date(body.planExpiry) : undefined);
  }

  // ── Medicine Verification ──────────────────────────────────────────────────

  @Get("medicines/pending/count")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Count of medicines awaiting verification" })
  pendingCount() {
    return this.platform.getPendingCount();
  }

  @Get("medicines/pending")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List medicines pending admin verification" })
  listPending(
    @Query("page") page = "1",
    @Query("limit") limit = "30",
    @Query("search") search?: string,
  ) {
    return this.platform.listPendingMedicines(+page, +limit, search);
  }

  @Patch("medicines/:id/verify")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve a pending medicine" })
  verify(@Param("id") id: string) {
    return this.platform.verifyMedicine(id);
  }

  @Patch("medicines/:id/reject")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reject a pending medicine with reason" })
  reject(@Param("id") id: string, @Body("notes") notes: string) {
    return this.platform.rejectMedicine(id, notes);
  }

  // ── Pharmacy Verification ─────────────────────────────────────────────────

  @Get("pharmacies/pending-verification")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List pharmacies awaiting verification" })
  pendingPharmacies() {
    return this.platform.listPendingPharmacies();
  }

  @Patch("pharmacies/:id/verify")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve a pharmacy" })
  verifyPharmacy(@Param("id") id: string) {
    return this.platform.verifyPharmacy(id);
  }

  @Patch("pharmacies/:id/reject-verification")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reject a pharmacy with reason" })
  rejectPharmacy(@Param("id") id: string, @Body("note") note: string) {
    return this.platform.rejectPharmacy(id, note);
  }

  // ── Support Tickets ───────────────────────────────────────────────────────

  @Get("support-tickets")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  listTickets(@Query("status") status?: string) {
    return this.platform.listSupportTickets(status);
  }

  @Patch("support-tickets/:id/status")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  updateTicket(@Param("id") id: string, @Body("status") status: string) {
    return this.platform.updateTicketStatus(id, status);
  }
}
