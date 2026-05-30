import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Req, Res, UploadedFile, UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { InventoryService } from "./inventory.service";
import { QuickAddService, QuickAddDto } from "./quick-add.service";
import { CreateInventoryItemDto } from "./dto/create-inventory-item.dto";
import { StockAdjustmentDto } from "./dto/stock-adjustment.dto";

@ApiTags("Inventory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/inventory")
export class InventoryController {
  constructor(
    private inventory: InventoryService,
    private quickAdd: QuickAddService,
  ) {}

  // ── Quick Add (unified medicine + stock in one step) ──────────────────────

  @Post("quick-add")
  quickAddMedicine(@Req() req: any, @Body() dto: QuickAddDto) {
    return this.quickAdd.quickAdd(req.user.pharmacyId, req.user.id, dto);
  }

  // ── Excel Import ──────────────────────────────────────────────────────────

  @Get("import/template")
  downloadTemplate(@Res() res: Response) {
    const buffer = this.quickAdd.generateExcelTemplate();
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=dawolink-medicine-import-template.xlsx",
    });
    res.send(buffer);
  }

  @Post("import/preview")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  previewImport(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("branchId") branchId: string,
  ) {
    if (!file) throw new Error("No file uploaded");
    return this.quickAdd.parseExcelTemplate(file.buffer, req.user.pharmacyId, branchId);
  }

  @Post("import/confirm")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  confirmImport(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("branchId") branchId: string,
  ) {
    if (!file) throw new Error("No file uploaded");
    return this.quickAdd.confirmImport(req.user.pharmacyId, req.user.id, branchId, file.buffer);
  }

  // ── Legacy endpoints (kept for backward compatibility) ────────────────────

  @Post("branches/:branchId/items")
  addItem(@Req() req: any, @Param("branchId") branchId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventory.addItem(branchId, req.user.id, req.user.pharmacyId, dto);
  }

  // POS dedicated lookup — fastest way to get price + stock for one medicine
  @Get("branches/:branchId/pos-stock/:medicineId")
  getPosStock(
    @Param("branchId") branchId: string,
    @Param("medicineId") medicineId: string,
  ) {
    return this.inventory.getPosStock(branchId, medicineId);
  }

  @Get("branches/:branchId/items")
  @ApiQuery({ name: "lowStock", required: false, type: Boolean })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "medicineId", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  getBranchStock(
    @Param("branchId") branchId: string,
    @Query("lowStock") lowStock?: string,
    @Query("search") search?: string,
    @Query("medicineId") medicineId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.inventory.getBranchStock(branchId, {
      lowStockOnly: lowStock === "true",
      search,
      medicineId,
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
