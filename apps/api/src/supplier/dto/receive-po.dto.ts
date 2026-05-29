import { Type } from "class-transformer";
import {
  IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min,
  ValidateIf, ValidateNested,
} from "class-validator";
import { MedicineForm } from "@dawolink/database";

class InlineMedicineDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsEnum(MedicineForm)
  form: MedicineForm;

  @IsOptional()
  @IsString()
  genericName?: string;

  @IsOptional()
  @IsString()
  strength?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsBoolean()
  requiresPrescription?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

class ReceiveItemDto {
  @IsString()
  poItemId: string;

  // Either medicineId OR newMedicine must be provided
  @ValidateIf(o => !o.newMedicine)
  @IsString()
  medicineId?: string;

  @ValidateIf(o => !o.medicineId)
  @ValidateNested()
  @Type(() => InlineMedicineDto)
  newMedicine?: InlineMedicineDto;

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
