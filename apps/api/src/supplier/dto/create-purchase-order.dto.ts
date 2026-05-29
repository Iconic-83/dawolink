import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class POItemDto {
  @ApiProperty()
  @IsString()
  medicineName: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsString()
  supplierId: string;

  @ApiProperty({ type: [POItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POItemDto)
  items: POItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;
}
