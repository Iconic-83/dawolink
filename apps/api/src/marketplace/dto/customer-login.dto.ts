import { IsString, MinLength } from "class-validator";

export class CustomerLoginDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(1)
  password: string;
}
