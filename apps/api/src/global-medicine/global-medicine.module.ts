import { Module } from "@nestjs/common";
import { DatabaseModule } from "../common/database/database.module";
import { GlobalMedicineController } from "./global-medicine.controller";
import { GlobalMedicineService } from "./global-medicine.service";

@Module({
  imports: [DatabaseModule],
  controllers: [GlobalMedicineController],
  providers: [GlobalMedicineService],
  exports: [GlobalMedicineService],
})
export class GlobalMedicineModule {}
