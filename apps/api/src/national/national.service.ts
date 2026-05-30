import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { MailService } from "../common/mail/mail.service";

@Injectable()
export class NationalService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // ── 1. National Shortage Detection ───────────────────────────────────────
  async getShortageReport() {
    const items = await this.prisma.inventoryItem.findMany({
      where: { deletedAt: null, quantity: { lte: 20 } },
      include: {
        medicine: true,
        branch: { include: { pharmacy: true } },
      },
      orderBy: { quantity: "asc" },
    });

    const byMedicine: Record<string, any> = {};
    for (const item of items) {
      const name = item.medicine.name;
      if (!byMedicine[name]) {
        byMedicine[name] = {
          medicine: name,
          genericName: item.medicine.genericName,
          category: item.medicine.category,
          totalAffectedBranches: 0,
          criticalBranches: 0,
          lowBranches: 0,
          locations: [],
        };
      }
      const entry = byMedicine[name];
      entry.totalAffectedBranches++;
      if (item.quantity === 0) entry.criticalBranches++;
      else entry.lowBranches++;
      entry.locations.push({
        branchName: item.branch.name,
        pharmacyName: item.branch.pharmacy.name,
        city: item.branch.pharmacy.city,
        quantity: item.quantity,
      });
    }

    const results = Object.values(byMedicine).sort(
      (a, b) => b.criticalBranches - a.criticalBranches,
    );

    return {
      totalShortages: results.length,
      critical: results.filter(r => r.criticalBranches > 0).length,
      shortages: results.slice(0, 50),
    };
  }

  // ── 2. National Price Intelligence ───────────────────────────────────────
  async getPriceIntelligence(medicine?: string) {
    const where: any = { deletedAt: null };
    if (medicine) {
      where.medicine = { name: { contains: medicine, mode: "insensitive" } };
    }

    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        medicine: true,
        branch: { include: { pharmacy: true } },
      },
      take: 500,
    });

    const byMedicine: Record<string, any> = {};
    for (const item of items) {
      const name = item.medicine.name;
      if (!byMedicine[name]) {
        byMedicine[name] = { medicine: name, category: item.medicine.category, prices: [] };
      }
      const price = Number(item.sellingPrice);
      if (price > 0) {
        byMedicine[name].prices.push({
          price,
          pharmacyName: item.branch.pharmacy.name,
          city: item.branch.pharmacy.city,
          availability: item.quantity > 10 ? "available" : item.quantity > 0 ? "low_stock" : "out_of_stock",
        });
      }
    }

    const results = Object.values(byMedicine).map((entry: any) => {
      const prices = entry.prices.map((p: any) => p.price);
      return {
        ...entry,
        avgPrice: prices.length ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        priceSpread: prices.length ? Math.max(...prices) - Math.min(...prices) : 0,
        pharmacyCount: entry.prices.length,
      };
    });

    return {
      total: results.length,
      medicines: results
        .sort((a, b) => b.pharmacyCount - a.pharmacyCount)
        .slice(0, 100),
    };
  }

  // ── 3. Disease Trend Dashboard ────────────────────────────────────────────
  async getDiseaseTrends(days = 30) {
    const since = new Date(Date.now() - days * 86400000);

    const transactions = await this.prisma.transaction.findMany({
      where: { createdAt: { gte: since } },
      include: {
        items: { include: { medicine: true } },
        branch: { include: { pharmacy: true } },
      },
    });

    const byCategoryCity: Record<string, Record<string, number>> = {};
    const byMedicine: Record<string, number> = {};

    for (const tx of transactions) {
      const city = tx.branch?.pharmacy?.city ?? "Unknown";
      for (const item of tx.items) {
        const cat = item.medicine?.category ?? "Other";
        const name = item.medicine?.name ?? "Unknown";
        const qty = item.quantity ?? 1;

        if (!byCategoryCity[cat]) byCategoryCity[cat] = {};
        byCategoryCity[cat][city] = (byCategoryCity[cat][city] ?? 0) + qty;
        byMedicine[name] = (byMedicine[name] ?? 0) + qty;
      }
    }

    const categoryTrends = Object.entries(byCategoryCity).map(([category, cities]) => ({
      category,
      totalSold: Object.values(cities).reduce((a, b) => a + b, 0),
      topCities: Object.entries(cities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([city, count]) => ({ city, count })),
    })).sort((a, b) => b.totalSold - a.totalSold);

    const topMedicines = Object.entries(byMedicine)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([medicine, count]) => ({ medicine, count }));

    return { days, categoryTrends, topMedicines };
  }

  // ── 4. Medicine Recall System ─────────────────────────────────────────────
  async getRecalls(activeOnly = true) {
    return this.prisma.medicineRecall.findMany({
      where: activeOnly ? { resolvedAt: null } : {},
      orderBy: { issuedAt: "desc" },
    });
  }

  async createRecall(dto: {
    medicineName: string;
    batchNumber?: string;
    manufacturer?: string;
    reason: string;
    severity: "LOW" | "HIGH" | "CRITICAL";
  }) {
    const recall = await this.prisma.medicineRecall.create({
      data: {
        medicineName: dto.medicineName,
        batchNumber: dto.batchNumber,
        manufacturer: dto.manufacturer,
        reason: dto.reason,
        severity: dto.severity,
        issuedAt: new Date(),
      },
    });

    if (dto.severity !== "LOW") {
      await this.notifyRecallToPharmacies(recall);
    }

    return recall;
  }

  async resolveRecall(id: string) {
    return this.prisma.medicineRecall.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
  }

  private async notifyRecallToPharmacies(recall: any) {
    const owners = await this.prisma.user.findMany({
      where: { role: "PHARMACY_OWNER" },
      select: { email: true, firstName: true, lastName: true },
    });

    for (const owner of owners.filter(o => o.email)) {
      const name = `${owner.firstName} ${owner.lastName}`;
      await this.mail.sendEmail({
        to: owner.email!,
        subject: `⚠️ Medicine Recall Alert: ${recall.medicineName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto">
            <div style="background:#EF4444;padding:20px;border-radius:8px 8px 0 0">
              <h2 style="color:#fff;margin:0">⚠️ Medicine Recall Alert</h2>
            </div>
            <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
              <p>Dear ${name},</p>
              <p>A medicine recall has been issued. Please check your inventory immediately.</p>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;font-weight:bold">Medicine</td><td style="padding:8px">${recall.medicineName}</td></tr>
                ${recall.batchNumber ? `<tr><td style="padding:8px;font-weight:bold">Batch</td><td style="padding:8px">${recall.batchNumber}</td></tr>` : ""}
                ${recall.manufacturer ? `<tr><td style="padding:8px;font-weight:bold">Manufacturer</td><td style="padding:8px">${recall.manufacturer}</td></tr>` : ""}
                <tr><td style="padding:8px;font-weight:bold">Severity</td><td style="padding:8px;color:#EF4444;font-weight:bold">${recall.severity}</td></tr>
                <tr><td style="padding:8px;font-weight:bold">Reason</td><td style="padding:8px">${recall.reason}</td></tr>
              </table>
              <p style="color:#ef4444;font-weight:bold">Action Required: Remove affected stock immediately and do not dispense.</p>
            </div>
          </div>`,
      });
    }
  }
}
