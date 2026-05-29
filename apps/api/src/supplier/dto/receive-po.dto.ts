import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

class ReceiveItemDto {
  @IsString()
  poItemId: string;

  @IsString()
  medicineId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  receivedQty: number;

  @IsNumber()
  @Type(() => Number)
  costPrice: number;

  @IsNumber()
  @Type(() => Number)
  sellingPrice: number;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class ReceivePODto {
  @IsString()
  branchId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
}
