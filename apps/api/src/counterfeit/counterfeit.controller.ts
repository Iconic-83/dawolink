import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CounterfeitService } from "./counterfeit.service";

@ApiTags("Counterfeit Detection")
@Controller({ path: "counterfeit", version: "1" })
export class CounterfeitController {
  constructor(private readonly svc: CounterfeitService) {}

  @Post("scan")
  scan(@Body() dto: {
    medicineName: string;
    batchNumber?: string;
    barcode?: string;
    scannerType?: "STAFF" | "CUSTOMER" | "SYSTEM";
  }) {
    return this.svc.scan(dto);
  }

  @Get("history")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  history(@Query("limit") limit?: string) {
    return this.svc.getScanHistory(limit ? Number(limit) : 50);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  stats() {
    return this.svc.getStats();
  }
}
