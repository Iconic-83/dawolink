import {
  Controller, Post, Delete, Body, UploadedFile, UseInterceptors,
  UseGuards, BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CustomerGuard } from "./guards/customer.guard";
import { R2StorageService } from "../common/storage/r2-storage.service";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags("Prescriptions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CustomerGuard)
@Controller("v1/marketplace/prescriptions")
export class PrescriptionUploadController {
  constructor(private storage: R2StorageService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException("Only JPEG, PNG, WebP or PDF files are accepted"), false);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file received");
    const url = await this.storage.upload("prescriptions", file.originalname, file.buffer, file.mimetype);
    return { url, size: file.size, mimetype: file.mimetype };
  }

  @Delete("delete")
  async deleteFile(@Body("url") url: string) {
    if (!url) throw new BadRequestException("URL is required");
    await this.storage.delete(url);
    return { success: true };
  }
}
