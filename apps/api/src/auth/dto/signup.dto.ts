import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SignupDto {
  @ApiProperty({ example: "Al-Noor Pharmacy" })
  @IsString()
  pharmacyName: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: "mogadishu" })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;
}
