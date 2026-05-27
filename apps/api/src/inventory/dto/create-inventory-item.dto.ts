import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateInventoryItemDto {
  @ApiProperty()
  @IsString()
  medicineId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNo?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  reorderLevel?: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  costPrice: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  sellingPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;
}
