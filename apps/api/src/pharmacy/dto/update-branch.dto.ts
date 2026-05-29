import { IsBoolean, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateBranchDto {
  @ApiPropertyOptional() @IsOptional() @IsString()  name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isMain?: boolean;
}
