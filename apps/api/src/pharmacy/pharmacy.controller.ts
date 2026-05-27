import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PharmacyService } from "./pharmacy.service";
import { CreatePharmacyDto } from "./dto/create-pharmacy.dto";
import { CreateBranchDto } from "./dto/create-branch.dto";

@ApiTags("Pharmacy")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("v1/pharmacy")
export class PharmacyController {
  constructor(private pharmacy: PharmacyService) {}

  @Post()
  create(@Body() dto: CreatePharmacyDto) {
    return this.pharmacy.create(dto);
  }

  @Get("me")
  getMyPharmacy(@Req() req: any) {
    return this.pharmacy.findOne(req.user.pharmacyId);
  }

  @Get("branches")
  getBranches(@Req() req: any) {
    return this.pharmacy.getBranches(req.user.pharmacyId);
  }

  @Post("branches")
  createBranch(@Req() req: any, @Body() dto: CreateBranchDto) {
    return this.pharmacy.createBranch(req.user.pharmacyId, dto);
  }

  @Get("staff")
  getStaff(@Req() req: any) {
    return this.pharmacy.getStaff(req.user.pharmacyId);
  }
}
