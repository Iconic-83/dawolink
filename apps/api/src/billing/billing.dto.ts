import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export enum PaymentMethod {
  EVC_PLUS = "EVC_PLUS",
  ZAAD = "ZAAD",
  SAHAL = "SAHAL",
  PREMIER_WALLET = "PREMIER_WALLET",
}

export class SubmitPaymentDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: "MP210528001234" })
  @IsString()
  reference: string;

  @ApiProperty({ example: 29 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ enum: ["MONTHLY", "ANNUAL"] })
  @IsOptional()
  @IsString()
  billingCycle?: "MONTHLY" | "ANNUAL";
}
