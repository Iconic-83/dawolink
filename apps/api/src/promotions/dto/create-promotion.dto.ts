import { IsString, IsEnum, IsNumber, IsOptional, IsInt, Min, Max, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreatePromotionDto {
  @ApiProperty() @IsString() @MaxLength(20) code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: ["PERCENTAGE", "FIXED_AMOUNT"] }) @IsEnum(["PERCENTAGE", "FIXED_AMOUNT"]) type: "PERCENTAGE" | "FIXED_AMOUNT";
  @ApiProperty() @IsNumber() @Min(0.01) @Type(() => Number) value: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Type(() => Number) minOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Type(() => Number) usageLimit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() expiresAt?: string;
}
