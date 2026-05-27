import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaymentMethod, TransactionType } from "@dawolink/database";

export class TransactionItemDto {
  @ApiProperty()
  @IsString()
  medicineId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNo?: string;
}

function IsInt() {
  return IsNumber({ maxDecimalPlaces: 0 });
}

export class CreateTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ enum: TransactionType, default: TransactionType.SALE })
  @IsEnum(TransactionType)
  type: TransactionType = TransactionType.SALE;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod = PaymentMethod.CASH;

  @ApiProperty({ type: [TransactionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items: TransactionItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount?: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  amountPaid: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
