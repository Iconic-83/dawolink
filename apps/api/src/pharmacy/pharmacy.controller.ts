import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException, Res,
} from "@nestjs/common";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { v4 as uuidv4 } from "uuid";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PharmacyService } from "./pharmacy.service";
import { CreatePharmacyDto } from "./dto/create-pharmacy.dto";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { UpdatePharmacyDto } from "./dto/update-pharmacy.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";
import { CreateInviteDto } from "./dto/create-invite.dto";
import { UpdatePharmacySettingsDto } from "./dto/update-pharmacy-settings.dto";

const LOGO_DIR = join(process.cwd(), "uploads", "logos");

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

  @Patch("me")
  updateProfile(@Req() req: any, @Body() dto: UpdatePharmacyDto) {
    return this.pharmacy.updateProfile(req.user.pharmacyId, req.user.id, dto);
  }

  @Post("logo")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("logo", {
      storage: diskStorage({
        destination: LOGO_DIR,
        filename: (_req, _file, cb) => cb(null, `${uuidv4()}${extname(_file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException("Only JPEG, PNG or WebP images are accepted"), false);
      },
    }),
  )
  uploadLogo(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file received");
    const logoUrl = `/uploads/logos/${file.filename}`;
    return this.pharmacy.updateLogo(req.user.pharmacyId, logoUrl);
  }

  @Get("branches")
  getBranches(@Req() req: any) {
    return this.pharmacy.getBranches(req.user.pharmacyId);
  }

  @Post("branches")
  createBranch(@Req() req: any, @Body() dto: CreateBranchDto) {
    return this.pharmacy.createBranch(req.user.pharmacyId, req.user.id, dto);
  }

  @Patch("branches/:id")
  updateBranch(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateBranchDto) {
    return this.pharmacy.updateBranch(req.user.pharmacyId, req.user.id, id, dto);
  }

  @Delete("branches/:id")
  deactivateBranch(@Req() req: any, @Param("id") id: string) {
    return this.pharmacy.deactivateBranch(req.user.pharmacyId, req.user.id, id);
  }

  @Get("staff")
  getStaff(@Req() req: any) {
    return this.pharmacy.getStaff(req.user.pharmacyId, req.user.role, req.user.branchId);
  }

  @Patch("staff/:id")
  updateStaff(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateStaffDto) {
    return this.pharmacy.updateStaff(req.user.pharmacyId, req.user.id, id, dto);
  }

  @Patch("staff/:id/deactivate")
  deactivateStaff(@Req() req: any, @Param("id") id: string) {
    return this.pharmacy.deactivateStaff(req.user.pharmacyId, req.user.id, id);
  }

  @Patch("staff/:id/reactivate")
  reactivateStaff(@Req() req: any, @Param("id") id: string) {
    return this.pharmacy.reactivateStaff(req.user.pharmacyId, req.user.id, id);
  }

  // ── Backup & Restore ───────────────────────────────────────────────────────

  @Get("backup")
  async exportBackup(@Req() req: any, @Res() res: Response) {
    const data = await this.pharmacy.exportBackup(req.user.pharmacyId);
    const filename = `dawolink-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }

  @Post("restore")
  restoreBackup(@Req() req: any, @Body() body: any) {
    if (!body || typeof body !== "object") throw new BadRequestException("Invalid backup payload");
    if (!body.version || !body.exportedAt) throw new BadRequestException("File does not appear to be a DawoLink backup");
    return this.pharmacy.restoreBackup(req.user.pharmacyId, req.user.id, body);
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  @Get("settings")
  getSettings(@Req() req: any) {
    return this.pharmacy.getSettings(req.user.pharmacyId);
  }

  @Patch("settings")
  updateSettings(@Req() req: any, @Body() dto: UpdatePharmacySettingsDto) {
    return this.pharmacy.updateSettings(req.user.pharmacyId, req.user.id, dto);
  }

  // ── Staff invites ──────────────────────────────────────────────────────────

  @Post("invites")
  createInvite(@Req() req: any, @Body() dto: CreateInviteDto) {
    const frontendUrl = req.headers.origin ?? process.env.FRONTEND_URL ?? "http://localhost:3000";
    return this.pharmacy.createInvite(req.user.pharmacyId, req.user.id, dto, frontendUrl);
  }

  @Get("invites")
  listInvites(@Req() req: any) {
    return this.pharmacy.listInvites(req.user.pharmacyId);
  }

  @Delete("invites/:id")
  revokeInvite(@Req() req: any, @Param("id") id: string) {
    return this.pharmacy.revokeInvite(req.user.pharmacyId, req.user.id, id);
  }
}
