import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CustomerGuard } from "../marketplace/guards/customer.guard";
import { ReservationService } from "./reservation.service";

@ApiTags("Reservations")
@Controller({ path: "reservations", version: "1" })
export class ReservationController {
  constructor(private readonly svc: ReservationService) {}

  // ── Customer endpoints ─────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  reserve(@Req() req: any, @Body() dto: {
    pharmacyId: string;
    branchId: string;
    inventoryItemId: string;
    quantity?: number;
  }) {
    return this.svc.reserve(req.user.id, dto);
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  mine(@Req() req: any) {
    return this.svc.getMyReservations(req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  cancel(@Req() req: any, @Param("id") id: string) {
    return this.svc.cancel(req.user.id, id);
  }

  // ── Pharmacy staff endpoints ───────────────────────────────────────────────

  @Get("pharmacy")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  pharmacyReservations(@Req() req: any) {
    return this.svc.getPharmacyReservations(req.user.pharmacyId);
  }

  @Patch(":id/confirm")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  confirm(@Param("id") id: string) {
    return this.svc.confirmReservation(id);
  }
}
