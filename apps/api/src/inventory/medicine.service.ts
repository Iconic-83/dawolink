import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreateMedicineDto } from "./dto/create-medicine.dto";
import { UpdateMedicineDto } from "./dto/update-medicine.dto";

@Injectable()
export class MedicineService {
  constructor(private prisma: PrismaService) {}

  async create(pharmacyId: string, dto: CreateMedicineDto) {
    if (dto.barcode) {
      const exists = await this.prisma.medicine.findUnique({
        where: { pharmacyId_barcode: { pharmacyId, barcode: dto.barcode } },
      });
      if (exists) throw new ConflictException("Barcode already exists");
    }

    return this.prisma.medicine.create({
      data: { ...dto, pharmacyId },
    });
  }

  findAll(pharmacyId: string, search?: string) {
    return this.prisma.medicine.findMany({
      where: {
        pharmacyId,
        isActive: true,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { genericName: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search } },
          ],
        }),
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(pharmacyId: string, id: string) {
    const medicine = await this.prisma.medicine.findFirst({
      where: { id, pharmacyId, deletedAt: null },
    });
    if (!medicine) throw new NotFoundException("Medicine not found");
    return medicine;
  }

  async findByBarcode(pharmacyId: string, barcode: string) {
    const medicine = await this.prisma.medicine.findFirst({
      where: { pharmacyId, barcode, deletedAt: null },
      include: {
        inventory: {
          where: { quantity: { gt: 0 }, deletedAt: null },
          orderBy: { expiryDate: "asc" },
          take: 1,
        },
      },
    });
    if (!medicine) throw new NotFoundException("Medicine not found");
    return medicine;
  }

  async update(pharmacyId: string, id: string, dto: UpdateMedicineDto) {
    await this.findOne(pharmacyId, id);
    return this.prisma.medicine.update({ where: { id }, data: dto });
  }

  async remove(pharmacyId: string, id: string) {
    await this.findOne(pharmacyId, id);
    return this.prisma.medicine.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
