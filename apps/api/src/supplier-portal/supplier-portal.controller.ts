import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SupplierPortalService } from "./supplier-portal.service";

// Guard that checks actorType = supplier_user
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";

@Injectable()
class SupplierGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.actorType === "supplier_user";
  }
}

@ApiTags("Supplier Portal")
@Controller("v1/supplier-portal")
export class SupplierPortalController {
  constructor(private service: SupplierPortalService) {}

  // ── Auth ──────────────────────────────────────────────────────────────────

  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supplier user login" })
  login(@Body("email") email: string, @Body("password") password: string) {
    return this.service.login(email, password);
  }

  @Get("auth/me")
  @UseGuards(JwtAuthGuard, SupplierGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Current supplier user profile" })
  me(@Req() req: any) {
    return this.service.getMe(req.user.id);
  }

  // ── Purchase Orders ───────────────────────────────────────────────────────

  @Get("orders")
  @UseGuards(JwtAuthGuard, SupplierGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List purchase orders for my supplier" })
  listOrders(@Req() req: any, @Query("status") status?: string) {
    return this.service.getOrders(req.user.supplierId, status);
  }

  @Get("orders/:id")
  @UseGuards(JwtAuthGuard, SupplierGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get single purchase order" })
  getOrder(@Req() req: any, @Param("id") id: string) {
    return this.service.getOrder(req.user.supplierId, id);
  }

  @Patch("orders/:id/confirm")
  @UseGuards(JwtAuthGuard, SupplierGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirm a purchase order" })
  confirmOrder(@Req() req: any, @Param("id") id: string, @Body("note") note?: string) {
    return this.service.confirmOrder(req.user.supplierId, id, note);
  }

  @Patch("orders/:id/reject")
  @UseGuards(JwtAuthGuard, SupplierGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reject a purchase order" })
  rejectOrder(@Req() req: any, @Param("id") id: string, @Body("note") note: string) {
    return this.service.rejectOrder(req.user.supplierId, id, note);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, SupplierGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Supplier dashboard stats" })
  stats(@Req() req: any) {
    return this.service.getStats(req.user.supplierId);
  }

  // ── Pharmacy: manage supplier users ───────────────────────────────────────

  @Post("suppliers/:supplierId/users")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a portal account for a supplier contact (pharmacy only)" })
  createUser(
    @Req() req: any,
    @Param("supplierId") supplierId: string,
    @Body() dto: { email: string; password: string; firstName: string; lastName: string; phone?: string },
  ) {
    return this.service.createSupplierUser(req.user.pharmacyId, supplierId, dto);
  }

  @Get("suppliers/:supplierId/users")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List portal accounts for a supplier" })
  listUsers(@Req() req: any, @Param("supplierId") supplierId: string) {
    return this.service.listSupplierUsers(req.user.pharmacyId, supplierId);
  }
}
