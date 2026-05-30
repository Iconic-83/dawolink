import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import * as XLSX from "xlsx";
import { PrismaService } from "../common/database/prisma.service";
import { AuditService } from "../audit/audit.service";

export interface QuickAddDto {
  // Medicine
  name: string;
  genericName?: string;
  brandName?: string;
  barcode?: string;
  category: string;
  form: string;
  strength?: string;
  unit?: string;
  requiresPrescription?: boolean;
  description?: string;
  manufacturer?: string;
  country?: string;
  imageUrl?: string;
  // Inventory
  branchId: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  batchNo?: string;
  expiryDate?: string;
  reorderLevel?: number;
  location?: string;
  // Supplier
  supplierId?: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  // Mode
  saveMode: "draft" | "verify" | "add_another";
}

export interface ImportRowResult {
  row: number;
  name: string;
  status: "valid" | "duplicate" | "error";
  error?: string;
}

@Injectable()
export class QuickAddService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ── Quick Add (unified medicine + inventory in one transaction) ────────────
  async quickAdd(pharmacyId: string, userId: string, dto: QuickAddDto) {
    // Validate expiry
    if (dto.expiryDate && new Date(dto.expiryDate) < new Date()) {
      throw new BadRequestException("Expiry date cannot be in the past");
    }
    // Validate price
    if (dto.sellingPrice < dto.costPrice) {
      throw new BadRequestException("Selling price cannot be less than cost price");
    }
    // Barcode duplicate check
    if (dto.barcode) {
      const exists = await this.prisma.medicine.findUnique({
        where: { pharmacyId_barcode: { pharmacyId, barcode: dto.barcode } },
      });
      if (exists && exists.deletedAt === null) {
        throw new ConflictException(`Barcode ${dto.barcode} already exists for "${exists.name}"`);
      }
    }

    const verificationStatus = dto.saveMode === "draft" ? "PENDING_VERIFICATION" : "VERIFIED";

    const result = await this.prisma.$transaction(async (tx) => {
      const medicine = await tx.medicine.create({
        data: {
          pharmacyId,
          name: dto.name.trim(),
          genericName: dto.genericName?.trim() || null,
          barcode: dto.barcode?.trim() || null,
          category: dto.category,
          form: dto.form as any,
          strength: dto.strength?.trim() || null,
          unit: dto.unit || "pcs",
          requiresPrescription: dto.requiresPrescription ?? false,
          description: dto.description?.trim() || null,
          imageUrl: dto.imageUrl || null,
          verificationStatus,
        },
      });

      const item = await tx.inventoryItem.create({
        data: {
          medicineId: medicine.id,
          branchId: dto.branchId,
          quantity: dto.quantity,
          costPrice: dto.costPrice,
          sellingPrice: dto.sellingPrice,
          batchNo: dto.batchNo?.trim() || null,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          reorderLevel: dto.reorderLevel ?? 10,
          location: dto.location?.trim() || null,
          supplierId: dto.supplierId || null,
        },
      });

      return { medicine, item };
    });

    this.audit.log({
      pharmacyId,
      userId,
      action: "STOCK_ADDED",
      entity: "Medicine",
      entityId: result.medicine.id,
      newValue: {
        medicineName: result.medicine.name,
        quantity: dto.quantity,
        branchId: dto.branchId,
        verificationStatus,
      },
    });

    return {
      medicine: result.medicine,
      inventoryItem: result.item,
      verified: verificationStatus === "VERIFIED",
      message: verificationStatus === "VERIFIED"
        ? `${dto.name} added and verified. Now visible in POS, inventory, and marketplace.`
        : `${dto.name} saved as draft. Submit for verification to make it available.`,
    };
  }

  // ── Excel Import ───────────────────────────────────────────────────────────
  async parseExcelTemplate(fileBuffer: Buffer, pharmacyId: string, branchId: string) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) throw new BadRequestException("Excel file is empty");
    if (rows.length > 5000) throw new BadRequestException("Maximum 5,000 rows per import");

    // Get existing barcodes for this pharmacy
    const existingBarcodes = await this.prisma.medicine.findMany({
      where: { pharmacyId, deletedAt: null, barcode: { not: null } },
      select: { barcode: true, name: true },
    });
    const barcodeMap = new Map(existingBarcodes.map(m => [m.barcode!, m.name]));

    const results: ImportRowResult[] = [];
    const validRows: QuickAddDto[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      const name = String(r["Name"] || r["Medicine Name"] || r["name"] || "").trim();
      const qty = Number(r["Qty"] || r["Quantity"] || r["qty"] || 0);
      const costPrice = Number(r["Cost"] || r["Unit Cost"] || r["cost_price"] || 0);
      const sellingPrice = Number(r["Price"] || r["Selling Price"] || r["selling_price"] || 0);
      const barcode = String(r["Barcode"] || r["barcode"] || "").trim() || undefined;
      const form = String(r["Form"] || r["form"] || "TABLET").toUpperCase();
      const expiryRaw = r["Expiry"] || r["Expiry Date"] || r["expiry_date"];

      if (!name) {
        results.push({ row: rowNum, name: "(empty)", status: "error", error: "Medicine name is required" });
        continue;
      }
      if (qty <= 0) {
        results.push({ row: rowNum, name, status: "error", error: "Quantity must be > 0" });
        continue;
      }
      if (sellingPrice <= 0) {
        results.push({ row: rowNum, name, status: "error", error: "Selling price is required" });
        continue;
      }
      if (barcode && barcodeMap.has(barcode)) {
        results.push({ row: rowNum, name, status: "duplicate", error: `Barcode ${barcode} already used by "${barcodeMap.get(barcode)}"` });
        continue;
      }

      // Parse expiry
      let expiryDate: string | undefined;
      if (expiryRaw) {
        const d = expiryRaw instanceof Date ? expiryRaw : new Date(expiryRaw);
        if (!isNaN(d.getTime())) {
          if (d < new Date()) {
            results.push({ row: rowNum, name, status: "error", error: "Expiry date is in the past" });
            continue;
          }
          expiryDate = d.toISOString().split("T")[0];
        }
      }

      const VALID_FORMS = ["TABLET","CAPSULE","SYRUP","INJECTION","CREAM","DROPS","INHALER","POWDER","SUPPOSITORY","PATCH","OTHER"];

      validRows.push({
        name,
        genericName: String(r["Generic"] || r["Generic Name"] || "").trim() || undefined,
        barcode,
        category: String(r["Category"] || r["category"] || "Other").trim(),
        form: VALID_FORMS.includes(form) ? form : "OTHER",
        strength: String(r["Strength"] || r["strength"] || "").trim() || undefined,
        requiresPrescription: String(r["RX"] || r["rx"] || "").toLowerCase() === "yes",
        description: String(r["Description"] || r["description"] || "").trim() || undefined,
        branchId,
        quantity: qty,
        costPrice,
        sellingPrice,
        batchNo: String(r["Batch"] || r["Batch Number"] || r["batch_no"] || "").trim() || undefined,
        expiryDate,
        reorderLevel: Number(r["Reorder"] || r["Reorder Level"] || 10) || 10,
        supplierId: undefined,
        saveMode: "verify",
      });

      results.push({ row: rowNum, name, status: "valid" });
    }

    const valid = results.filter(r => r.status === "valid").length;
    const duplicates = results.filter(r => r.status === "duplicate").length;
    const errors = results.filter(r => r.status === "error").length;

    return {
      total: rows.length,
      valid,
      duplicates,
      errors,
      rows: results,
      preview: validRows.slice(0, 5),
    };
  }

  async confirmImport(pharmacyId: string, userId: string, branchId: string, fileBuffer: Buffer) {
    const preview = await this.parseExcelTemplate(fileBuffer, pharmacyId, branchId);

    const validRows = await this.buildValidRows(fileBuffer, pharmacyId, branchId);

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of validRows) {
      try {
        await this.quickAdd(pharmacyId, userId, { ...row, saveMode: "verify" });
        imported++;
      } catch (e: any) {
        failed++;
        errors.push(`${row.name}: ${e.message}`);
      }
    }

    return { imported, failed, errors: errors.slice(0, 20) };
  }

  private async buildValidRows(fileBuffer: Buffer, pharmacyId: string, branchId: string): Promise<QuickAddDto[]> {
    const result = await this.parseExcelTemplate(fileBuffer, pharmacyId, branchId);
    const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const VALID_FORMS = ["TABLET","CAPSULE","SYRUP","INJECTION","CREAM","DROPS","INHALER","POWDER","SUPPOSITORY","PATCH","OTHER"];
    const validIndices = new Set(
      result.rows.filter(r => r.status === "valid").map(r => r.row - 2)
    );

    return rows
      .filter((_, i) => validIndices.has(i))
      .map(r => {
        const form = String(r["Form"] || "TABLET").toUpperCase();
        const expiryRaw = r["Expiry"] || r["Expiry Date"] || r["expiry_date"];
        let expiryDate: string | undefined;
        if (expiryRaw) {
          const d = expiryRaw instanceof Date ? expiryRaw : new Date(expiryRaw);
          if (!isNaN(d.getTime())) expiryDate = d.toISOString().split("T")[0];
        }
        return {
          name: String(r["Name"] || r["Medicine Name"] || "").trim(),
          genericName: String(r["Generic"] || "").trim() || undefined,
          barcode: String(r["Barcode"] || "").trim() || undefined,
          category: String(r["Category"] || "Other").trim(),
          form: VALID_FORMS.includes(form) ? form : "OTHER",
          strength: String(r["Strength"] || "").trim() || undefined,
          requiresPrescription: String(r["RX"] || "").toLowerCase() === "yes",
          branchId,
          quantity: Number(r["Qty"] || r["Quantity"] || 0),
          costPrice: Number(r["Cost"] || r["Unit Cost"] || 0),
          sellingPrice: Number(r["Price"] || r["Selling Price"] || 0),
          batchNo: String(r["Batch"] || "").trim() || undefined,
          expiryDate,
          reorderLevel: Number(r["Reorder"] || 10) || 10,
          saveMode: "verify" as const,
        };
      });
  }

  generateExcelTemplate(): Buffer {
    const headers = [
      "Name", "Generic", "Brand", "Form", "Strength", "Barcode",
      "Category", "RX", "Description", "Manufacturer",
      "Supplier", "Invoice", "Purchase Date",
      "Batch", "Expiry", "Qty", "Cost", "Price", "Reorder"
    ];
    const example = [
      "Amoxicillin 500mg", "Amoxicillin", "Amoxil", "CAPSULE", "500mg", "6009000000001",
      "Antibiotics", "No", "Broad spectrum antibiotic", "GSK",
      "", "", "",
      "BT-2026-001", "2027-12-31", "100", "1.50", "3.00", "20"
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, example]);

    // Column widths
    ws["!cols"] = headers.map((h, i) => ({
      wch: ["Name","Description","Generic","Manufacturer"].includes(h) ? 25 : 15
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicines");
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
}
