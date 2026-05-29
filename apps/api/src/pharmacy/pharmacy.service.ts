import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreatePharmacyDto } from "./dto/create-pharmacy.dto";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { UpdatePharmacyDto } from "./dto/update-pharmacy.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";
import { PLAN_LIMITS } from "../common/guards/plan.guard";

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
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: pharmacyId }, select: { plan: true } });
    const limit = PLAN_LIMITS[pharmacy?.plan ?? "STARTER"].branches;
    const count = await this.prisma.branch.count({ where: { pharmacyId, isActive: true } });
    if (count >= limit) {
      throw new ForbiddenException(`Your ${pharmacy?.plan} plan allows up to ${limit} branch${limit === 1 ? "" : "es"}. Upgrade to add more.`);
    }
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
      where: { pharmacyId },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, phone: true, role: true,
        branchId: true, lastLoginAt: true, isActive: true, createdAt: true,
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateStaff(pharmacyId: string, userId: string, dto: UpdateStaffDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, pharmacyId } });
    if (!user) throw new NotFoundException("Staff member not found");
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true, firstName: true, lastName: true,
        email: true, phone: true, role: true,
        branchId: true, isActive: true,
        branch: { select: { name: true } },
      },
    });
  }

  async deactivateStaff(pharmacyId: string, userId: string) {
    return this.updateStaff(pharmacyId, userId, { isActive: false });
  }

  async reactivateStaff(pharmacyId: string, userId: string) {
    return this.updateStaff(pharmacyId, userId, { isActive: true });
  }

  async updateProfile(pharmacyId: string, dto: UpdatePharmacyDto) {
    return this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: dto,
      include: { branches: { where: { isActive: true } } },
    });
  }

  async updateLogo(pharmacyId: string, logoUrl: string) {
    return this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: { logoUrl },
      select: { id: true, logoUrl: true },
    });
  }

  async updateBranch(pharmacyId: string, branchId: string, dto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, pharmacyId } });
    if (!branch) throw new NotFoundException("Branch not found");
    return this.prisma.branch.update({ where: { id: branchId }, data: dto });
  }

  async deactivateBranch(pharmacyId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, pharmacyId } });
    if (!branch) throw new NotFoundException("Branch not found");
    if (branch.isMain) throw new ForbiddenException("Cannot deactivate the main branch");
    return this.prisma.branch.update({ where: { id: branchId }, data: { isActive: false } });
  }
}
