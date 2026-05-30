import { IsOptional, IsString, IsBoolean, IsNumber, IsInt, Min, Max } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePharmacySettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() taxEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) taxRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() taxLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoicePrefix?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceFooter?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) defaultReorderLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(365) expiryWarningDays?: number;
}
