import { IsString, IsBoolean, IsOptional, IsArray, IsEnum } from "class-validator";
import { MedicineForm } from "@dawolink/database";

export class CreateGlobalMedicineDto {
  @IsString()
  name: string;

  @IsString()
  genericName: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  brandNames?: string[];

  @IsString()
  category: string;

  @IsEnum(MedicineForm)
  form: MedicineForm;

  @IsString()
  @IsOptional()
  strength?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  countryOfOrigin?: string;

  @IsBoolean()
  @IsOptional()
  requiresPrescription?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  sideEffects?: string;

  @IsString()
  @IsOptional()
  contraindications?: string;

  @IsString()
  @IsOptional()
  storageConditions?: string;

  @IsString()
  @IsOptional()
  atcCode?: string;

  @IsString()
  @IsOptional()
  barcode?: string;
}
