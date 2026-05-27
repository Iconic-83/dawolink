import { IsInt, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class StockAdjustmentDto {
  @ApiProperty()
  @IsString()
  itemId: string;

  @ApiProperty({ description: "Positive to add, negative to remove" })
  @IsInt()
  @Type(() => Number)
  adjustment: number;
}
