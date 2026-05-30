import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";

@Injectable()
export class CounterfeitService {
  constructor(private prisma: PrismaService) {}

  async scan(dto: {
    medicineName: string;
    batchNumber?: string;
    barcode?: string;
    scannedBy?: string;
    scannerType?: "STAFF" | "CUSTOMER" | "SYSTEM";
  }) {
    // Check against active recalls
    const recall = await this.prisma.medicineRecall.findFirst({
      where: {
        medicineName: { contains: dto.medicineName, mode: "insensitive" },
        resolvedAt: null,
        ...(dto.batchNumber ? { batchNumber: dto.batchNumber } : {}),
      },
    });

    // Check previous scans of same batch
    const previousSuspicious = dto.batchNumber
      ? await this.prisma.counterfeitScan.findFirst({
          where: { batchNumber: dto.batchNumber, result: { in: ["SUSPICIOUS", "COUNTERFEIT"] } },
        })
      : null;

    let result: "VERIFIED" | "SUSPICIOUS" | "COUNTERFEIT" | "UNVERIFIED" = "UNVERIFIED";
    let message = "Medicine could not be verified. Please check with the pharmacist.";
    let severity: "safe" | "warning" | "danger" = "warning";

    if (recall?.severity === "CRITICAL") {
      result = "COUNTERFEIT";
      message = `⚠️ RECALL ALERT: ${dto.medicineName} has an active CRITICAL recall. Do not use. Reason: ${recall.reason}`;
      severity = "danger";
    } else if (recall) {
      result = "SUSPICIOUS";
      message = `⚠️ Warning: ${dto.medicineName} has an active recall (${recall.severity}). Reason: ${recall.reason}`;
      severity = "warning";
    } else if (previousSuspicious?.result === "COUNTERFEIT") {
      result = "COUNTERFEIT";
      message = "This batch has been flagged as counterfeit by a previous scan.";
      severity = "danger";
    } else if (previousSuspicious) {
      result = "SUSPICIOUS";
      message = "This batch was previously flagged as suspicious. Use with caution.";
      severity = "warning";
    } else if (dto.barcode || dto.batchNumber) {
      result = "VERIFIED";
      message = `✓ ${dto.medicineName} appears legitimate. No recalls or counterfeit reports found.`;
      severity = "safe";
    }

    const scan = await this.prisma.counterfeitScan.create({
      data: {
        medicineName: dto.medicineName,
        batchNumber: dto.batchNumber,
        barcode: dto.barcode,
        scannedBy: dto.scannedBy,
        scannerType: dto.scannerType ?? "STAFF",
        result,
        notes: recall ? `Recall ID: ${recall.id}` : undefined,
      },
    });

    return { ...scan, message, severity, recall: recall ?? null };
  }

  async getScanHistory(limit = 50) {
    return this.prisma.counterfeitScan.findMany({
      orderBy: { scannedAt: "desc" },
      take: limit,
    });
  }

  async getStats() {
    const [total, verified, suspicious, counterfeit] = await Promise.all([
      this.prisma.counterfeitScan.count(),
      this.prisma.counterfeitScan.count({ where: { result: "VERIFIED" } }),
      this.prisma.counterfeitScan.count({ where: { result: "SUSPICIOUS" } }),
      this.prisma.counterfeitScan.count({ where: { result: "COUNTERFEIT" } }),
    ]);
    return { total, verified, suspicious, counterfeit };
  }
}
