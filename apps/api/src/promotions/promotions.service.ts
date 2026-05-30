import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  // ── Pharmacy management ───────────────────────────────────────────────────

  async create(pharmacyId: string, dto: CreatePromotionDto) {
    const existing = await this.prisma.promotion.findUnique({
      where: { pharmacyId_code: { pharmacyId, code: dto.code.toUpperCase() } },
    });
    if (existing) throw new ConflictException(`Promo code "${dto.code}" already exists`);

    return this.prisma.promotion.create({
      data: {
        pharmacyId,
        code: dto.code.toUpperCase(),
        description: dto.description,
        type: dto.type,
        value: dto.value,
        minOrder: dto.minOrder ?? 0,
        usageLimit: dto.usageLimit ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  list(pharmacyId: string) {
    return this.prisma.promotion.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(pharmacyId: string, id: string, dto: UpdatePromotionDto) {
    const promo = await this.prisma.promotion.findFirst({ where: { id, pharmacyId } });
    if (!promo) throw new NotFoundException("Promotion not found");
    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.minOrder !== undefined && { minOrder: dto.minOrder }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(pharmacyId: string, id: string) {
    const promo = await this.prisma.promotion.findFirst({ where: { id, pharmacyId } });
    if (!promo) throw new NotFoundException("Promotion not found");
    await this.prisma.promotion.delete({ where: { id } });
    return { success: true };
  }

  // ── Customer validation ───────────────────────────────────────────────────

  async validate(pharmacyId: string, code: string, orderSubtotal: number) {
    const promo = await this.prisma.promotion.findUnique({
      where: { pharmacyId_code: { pharmacyId, code: code.toUpperCase() } },
    });

    if (!promo || !promo.isActive) throw new NotFoundException("Invalid or inactive promo code");
    if (promo.expiresAt && new Date() > promo.expiresAt) throw new BadRequestException("This promo code has expired");
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException("This promo code has reached its usage limit");
    }
    if (orderSubtotal < Number(promo.minOrder)) {
      throw new BadRequestException(
        `Minimum order of $${Number(promo.minOrder).toFixed(2)} required for this promo`,
      );
    }

    const discount = promo.type === "PERCENTAGE"
      ? (orderSubtotal * Number(promo.value)) / 100
      : Number(promo.value);

    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: Number(promo.value),
      discount: Math.min(discount, orderSubtotal),
      description: promo.description,
    };
  }

  // Called after order is created to increment usage count
  async applyUsage(pharmacyId: string, code: string) {
    try {
      await this.prisma.promotion.updateMany({
        where: { pharmacyId, code: code.toUpperCase() },
        data: { usedCount: { increment: 1 } },
      });
    } catch {
      // non-critical
    }
  }
}
