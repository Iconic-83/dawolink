import { IsEmail, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class CustomerRegisterDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: "Enter a valid phone number" })
  phone: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
