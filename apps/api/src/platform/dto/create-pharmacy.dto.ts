import { IsString, IsEmail, IsOptional, IsEnum, MinLength } from "class-validator";
import { Plan } from "@dawolink/database";

export class AdminCreatePharmacyDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  licenseNo?: string;

  @IsEnum(Plan)
  @IsOptional()
  plan?: Plan;

  // Owner account to create alongside the pharmacy
  @IsEmail()
  ownerEmail: string;

  @IsString()
  ownerFirstName: string;

  @IsString()
  ownerLastName: string;

  @IsString()
  @MinLength(8)
  ownerPassword: string;
}
