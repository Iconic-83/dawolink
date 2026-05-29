import {
  Controller, Post, Delete, Body, UploadedFile, UseInterceptors,
  UseGuards, Req, BadRequestException, PayloadTooLargeException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { existsSync, unlinkSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CustomerGuard } from "./guards/customer.guard";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const UPLOAD_DIR = join(process.cwd(), "uploads", "prescriptions");

@ApiTags("Prescriptions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CustomerGuard)
@Controller("v1/marketplace/prescriptions")
export class PrescriptionUploadController {
  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, _file, cb) => cb(null, `${uuidv4()}${extname(_file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException("Only JPEG, PNG, WebP or PDF files are accepted"), false);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file received");
    const url = `/uploads/prescriptions/${file.filename}`;
    return { url, filename: file.filename, size: file.size, mimetype: file.mimetype };
  }

  @Delete("delete")
  deleteFile(@Body("filename") filename: string) {
    if (!filename || filename.includes("..") || filename.includes("/")) {
      throw new BadRequestException("Invalid filename");
    }
    const filepath = join(UPLOAD_DIR, filename);
    if (existsSync(filepath)) unlinkSync(filepath);
    return { success: true };
  }
}
