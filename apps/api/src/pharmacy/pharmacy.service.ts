import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreatePharmacyDto } from "./dto/create-pharmacy.dto";
import { CreateBranchDto } from "./dto/create-branch.dto";

@Injectable()
export class PharmacyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePharmacyDto) {
    return this.prisma.pharmacy.create({ data: dto });
  }

  async findOne(id: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id },
      include: { branches: true },
    });
    if (!pharmacy) throw new NotFoundException("Pharmacy not found");
    return pharmacy;
  }

  async createBranch(pharmacyId: string, dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: { ...dto, pharmacyId } });
  }

  async getBranches(pharmacyId: string) {
    return this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      orderBy: { isMain: "desc" },
    });
  }

  async getStaff(pharmacyId: string) {
    return this.prisma.user.findMany({
      where: { pharmacyId, isActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, phone: true, role: true,
        branchId: true, lastLoginAt: true,
      },
    });
  }
}
