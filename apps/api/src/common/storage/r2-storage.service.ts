import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { extname } from "path";
import { createWriteStream, mkdirSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

@Injectable()
export class R2StorageService {
  private readonly log = new Logger(R2StorageService.name);
  private readonly client?: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  readonly isEnabled: boolean;

  constructor(private config: ConfigService) {
    const accountId    = config.get("R2_ACCOUNT_ID", "");
    const accessKeyId  = config.get("R2_ACCESS_KEY_ID", "");
    const secretKey    = config.get("R2_SECRET_ACCESS_KEY", "");
    this.bucket        = config.get("R2_BUCKET_NAME", "dawolink");
    this.publicUrl     = config.get("R2_PUBLIC_URL", "").replace(/\/$/, "");
    this.isEnabled     = !!(accountId && accessKeyId && secretKey && this.publicUrl);

    if (this.isEnabled) {
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey: secretKey },
      });
      this.log.log(`Cloudflare R2 storage enabled (bucket: ${this.bucket})`);
    } else {
      this.log.warn("Cloudflare R2 not configured — files saved to local disk");
    }
  }

  /**
   * Upload a file buffer to R2 (or local disk fallback).
   * Returns the public URL.
   */
  async upload(
    folder: string,
    originalName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const ext = extname(originalName).toLowerCase() || ".bin";
    const key = `${folder}/${randomUUID()}${ext}`;

    if (this.isEnabled && this.client) {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000",
      }));
      const url = `${this.publicUrl}/${key}`;
      this.log.log(`Uploaded to R2: ${url}`);
      return url;
    }

    // Local disk fallback
    return this.saveLocally(folder, ext, buffer);
  }

  /**
   * Delete a file by its public URL. No-op if not R2 URL or not configured.
   */
  async delete(publicUrl: string): Promise<void> {
    if (!this.isEnabled || !this.client || !publicUrl.startsWith(this.publicUrl)) return;
    const key = publicUrl.replace(`${this.publicUrl}/`, "");
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      this.log.log(`Deleted from R2: ${key}`);
    } catch (err: any) {
      this.log.warn(`Failed to delete R2 object ${key}: ${err.message}`);
    }
  }

  private saveLocally(folder: string, ext: string, buffer: Buffer): string {
    const dir = join(process.cwd(), "uploads", folder);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    const filepath = join(dir, filename);
    const ws = createWriteStream(filepath);
    ws.write(buffer);
    ws.end();
    return `/uploads/${folder}/${filename}`;
  }
}
