import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { UserRole } from "@dawolink/database";

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  branchId?: string;
}
