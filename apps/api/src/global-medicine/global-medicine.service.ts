import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreateGlobalMedicineDto } from "./dto/create-global-medicine.dto";

@Injectable()
export class GlobalMedicineService {
  constructor(private prisma: PrismaService) {}

  async search(q: string, category?: string, page = 1, limit = 20) {
    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { genericName: { contains: q, mode: "insensitive" } },
        { brandNames: { has: q } },
      ];
    }
    if (category) where.category = category;
    where.isApproved = true;
    where.isFlagged = false;

    const [items, total] = await Promise.all([
      this.prisma.globalMedicine.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" } }),
      this.prisma.globalMedicine.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const med = await this.prisma.globalMedicine.findUnique({ where: { id } });
    if (!med) throw new NotFoundException("Medicine not found");
    return med;
  }

  async listCategories() {
    const result = await this.prisma.globalMedicine.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { isApproved: true },
      orderBy: { _count: { id: "desc" } },
    });
    return result.map(r => ({ category: r.category, count: r._count.id }));
  }

  // Admin-only operations
  async create(dto: CreateGlobalMedicineDto, adminId: string) {
    return this.prisma.globalMedicine.create({ data: { ...dto, brandNames: dto.brandNames ?? [], createdBy: adminId } });
  }

  async update(id: string, dto: Partial<CreateGlobalMedicineDto>) {
    await this.findOne(id);
    return this.prisma.globalMedicine.update({ where: { id }, data: dto });
  }

  async flag(id: string, reason: string) {
    return this.prisma.globalMedicine.update({ where: { id }, data: { isFlagged: true, flagReason: reason } });
  }

  async unflag(id: string) {
    return this.prisma.globalMedicine.update({ where: { id }, data: { isFlagged: false, flagReason: null } });
  }

  async listFlagged() {
    return this.prisma.globalMedicine.findMany({ where: { isFlagged: true }, orderBy: { updatedAt: "desc" } });
  }

  // Pharmacy action: import from global catalog into pharmacy medicine list
  async importToPharmacy(globalId: string, pharmacyId: string) {
    const global = await this.findOne(globalId);
    return this.prisma.medicine.create({
      data: {
        pharmacyId,
        name: global.name,
        genericName: global.genericName,
        category: global.category,
        form: global.form,
        strength: global.strength,
        unit: global.unit,
        requiresPrescription: global.requiresPrescription,
        description: global.description,
        imageUrl: global.imageUrl,
      },
    });
  }
}
