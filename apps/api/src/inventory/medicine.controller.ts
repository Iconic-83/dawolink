import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { MedicineService } from "./medicine.service";
import { CreateMedicineDto } from "./dto/create-medicine.dto";
import { UpdateMedicineDto } from "./dto/update-medicine.dto";

@ApiTags("Medicines")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/medicines")
export class MedicineController {
  constructor(private medicines: MedicineService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateMedicineDto) {
    return this.medicines.create(req.user.pharmacyId, dto);
  }

  @Get()
  @ApiQuery({ name: "search", required: false })
  findAll(@Req() req: any, @Query("search") search?: string) {
    return this.medicines.findAll(req.user.pharmacyId, search);
  }

  @Get("barcode/:barcode")
  findByBarcode(@Req() req: any, @Param("barcode") barcode: string) {
    return this.medicines.findByBarcode(req.user.pharmacyId, barcode);
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.medicines.findOne(req.user.pharmacyId, id);
  }

  @Put(":id")
  update(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateMedicineDto) {
    return this.medicines.update(req.user.pharmacyId, id, dto);
  }

  @Delete(":id")
  remove(@Req() req: any, @Param("id") id: string) {
    return this.medicines.remove(req.user.pharmacyId, id);
  }
}
