import { Type } from "class-transformer";
import {
  IsArray, IsEnum, IsNumber, IsOptional, IsString, IsInt,
  Min, ValidateNested,
} from "class-validator";

class OrderItemDto {
  @IsString()
  medicineName: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  unitPrice: number;
}

export class CreateOrderDto {
  @IsString()
  pharmacyId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(["DELIVERY", "PICKUP"])
  deliveryType: "DELIVERY" | "PICKUP";

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  deliveryCity?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  prescriptionUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  pointsToRedeem?: number;
}
