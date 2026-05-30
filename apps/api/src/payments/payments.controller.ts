import { Controller, Post, Get, Body, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { WaafiPayService } from "./waafipay.service";
import { PrismaService } from "../common/database/prisma.service";

@ApiTags("Payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/payments")
export class PaymentsController {
  constructor(
    private waafi: WaafiPayService,
    private prisma: PrismaService,
  ) {}

  @Get("gateway/status")
  @ApiOperation({ summary: "Check if payment gateway is configured" })
  gatewayStatus() {
    return { enabled: this.waafi.enabled };
  }

  @Post("initiate")
  @ApiOperation({ summary: "Initiate an EVC Plus / Zaad / Sahal payment push" })
  async initiate(
    @Req() req: any,
    @Body() body: {
      phone: string;
      amount: number;
      description: string;
      referenceId: string;
      method?: "EVC_PLUS" | "ZAAD" | "SAHAL" | "PREMIER_WALLET";
    },
  ) {
    return this.waafi.initiate({
      phone: body.phone,
      amount: body.amount,
      description: body.description,
      referenceId: body.referenceId,
      method: body.method ?? "EVC_PLUS",
    });
  }
}
