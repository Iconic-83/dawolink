import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PromotionsService } from "./promotions.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";

@ApiTags("Promotions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/promotions")
export class PromotionsController {
  constructor(private promotions: PromotionsService) {}

  @Post()
  @ApiOperation({ summary: "Create a promo code for your pharmacy" })
  create(@Req() req: any, @Body() dto: CreatePromotionDto) {
    return this.promotions.create(req.user.pharmacyId, dto);
  }

  @Get()
  @ApiOperation({ summary: "List all promo codes for your pharmacy" })
  list(@Req() req: any) {
    return this.promotions.list(req.user.pharmacyId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a promo code" })
  update(@Req() req: any, @Param("id") id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotions.update(req.user.pharmacyId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a promo code" })
  remove(@Req() req: any, @Param("id") id: string) {
    return this.promotions.remove(req.user.pharmacyId, id);
  }
}
