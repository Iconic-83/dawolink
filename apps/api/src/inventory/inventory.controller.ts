import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { InventoryService } from "./inventory.service";
import { CreateInventoryItemDto } from "./dto/create-inventory-item.dto";
import { StockAdjustmentDto } from "./dto/stock-adjustment.dto";

@ApiTags("Inventory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/inventory")
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Post("branches/:branchId/items")
  addItem(@Req() req: any, @Param("branchId") branchId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventory.addItem(branchId, req.user.id, req.user.pharmacyId, dto);
  }

  @Get("branches/:branchId/items")
  @ApiQuery({ name: "lowStock", required: false, type: Boolean })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getBranchStock(
    @Param("branchId") branchId: string,
    @Query("lowStock") lowStock?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.inventory.getBranchStock(branchId, {
      lowStockOnly: lowStock === "true",
      search,
      page: page ? parseInt(page) : 1,
      limit: Math.min(parseInt(limit ?? "50"), 200),
    });
  }

  @Get("branches/:branchId/low-stock")
  getLowStock(@Param("branchId") branchId: string) {
    return this.inventory.getLowStock(branchId);
  }

  @Post("adjust")
  adjustStock(@Req() req: any, @Body() dto: StockAdjustmentDto) {
    return this.inventory.adjustStock(req.user.id, req.user.pharmacyId, dto);
  }

  @Get("branches/:branchId/value")
  getStockValue(@Param("branchId") branchId: string) {
    return this.inventory.getStockValue(branchId);
  }
}
