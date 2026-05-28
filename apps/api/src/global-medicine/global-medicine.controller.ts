import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../platform/guards/platform-admin.guard";
import { GlobalMedicineService } from "./global-medicine.service";
import { CreateGlobalMedicineDto } from "./dto/create-global-medicine.dto";

@ApiTags("Global Medicine DB")
@Controller("v1/global-medicines")
export class GlobalMedicineController {
  constructor(private service: GlobalMedicineService) {}

  // Public endpoints (any authenticated user can search the catalog)
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Search global medicine catalog" })
  search(
    @Query("q") q = "",
    @Query("category") category?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.service.search(q, category, +page, +limit);
  }

  @Get("categories")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List medicine categories" })
  categories() {
    return this.service.listCategories();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get global medicine details" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  // Pharmacy: import medicine from global catalog
  @Post(":id/import")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Import global medicine into pharmacy catalog" })
  import(@Param("id") id: string, @Req() req: any) {
    return this.service.importToPharmacy(id, req.user.pharmacyId);
  }

  // Platform Admin-only endpoints
  @Post()
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add medicine to global catalog (admin)" })
  create(@Body() dto: CreateGlobalMedicineDto, @Req() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update global medicine (admin)" })
  update(@Param("id") id: string, @Body() dto: Partial<CreateGlobalMedicineDto>) {
    return this.service.update(id, dto);
  }

  @Patch(":id/flag")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Flag medicine as suspicious/counterfeit (admin)" })
  flag(@Param("id") id: string, @Body("reason") reason: string) {
    return this.service.flag(id, reason);
  }

  @Patch(":id/unflag")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unflag medicine (admin)" })
  unflag(@Param("id") id: string) {
    return this.service.unflag(id);
  }

  @Get("admin/flagged")
  @UseGuards(JwtAuthGuard, PlatformAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List flagged medicines (admin)" })
  flagged() {
    return this.service.listFlagged();
  }
}
