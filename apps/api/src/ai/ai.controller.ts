import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CustomerGuard } from "../marketplace/guards/customer.guard";
import { AiService } from "./ai.service";

@ApiTags("AI")
@Controller({ path: "ai", version: "1" })
export class AiController {
  constructor(private readonly ai: AiService) {}

  // ── Pharmacy staff endpoints ──────────────────────────────────────────────

  @Post("pharmacist")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  pharmacist(@Body() body: { question: string; medicineName?: string }) {
    return this.ai.pharmacistAssistant(body.question, body.medicineName);
  }

  @Post("demand-forecast")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  demandForecast(@Body() body: { branchId: string }) {
    return this.ai.demandForecast(body.branchId);
  }

  @Post("inventory-optimize")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  inventoryOptimize(@Body() body: { branchId: string }) {
    return this.ai.inventoryOptimize(body.branchId);
  }

  @Post("fraud-detect")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  fraudDetect(@Req() req: any, @Body() body: { days?: number }) {
    return this.ai.fraudDetect(req.user.pharmacyId, body.days ?? 30);
  }

  // ── Customer endpoint ─────────────────────────────────────────────────────

  @Post("health-assistant")
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  healthAssistant(@Body() body: { question: string }) {
    return this.ai.healthAssistant(body.question);
  }

  @Get("status")
  status() {
    return { enabled: this.ai.isEnabled };
  }
}
