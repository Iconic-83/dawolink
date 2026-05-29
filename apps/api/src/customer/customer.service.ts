import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  create(pharmacyId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        ...dto,
        pharmacyId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        allergies: dto.allergies ?? [],
      },
    });
  }

  findAll(pharmacyId: string, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        pharmacyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async findOne(pharmacyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, pharmacyId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { items: { include: { medicine: true } } },
        },
      },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
  }

  async update(pharmacyId: string, id: string, dto: Partial<CreateCustomerDto>) {
    await this.findOne(pharmacyId, id);
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        allergies: dto.allergies ?? undefined,
      },
    });
  }
}
