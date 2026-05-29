import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { MedicineController } from "./medicine.controller";
import { MedicineService } from "./medicine.service";
import { TransferController } from "./transfer.controller";
import { TransferService } from "./transfer.service";

@Module({
  controllers: [InventoryController, MedicineController, TransferController],
  providers: [InventoryService, MedicineService, TransferService],
  exports: [InventoryService, MedicineService, TransferService],
})
export class InventoryModule {}
