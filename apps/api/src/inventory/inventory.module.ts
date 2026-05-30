import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { MedicineController } from "./medicine.controller";
import { MedicineService } from "./medicine.service";
import { TransferController } from "./transfer.controller";
import { TransferService } from "./transfer.service";
import { QuickAddService } from "./quick-add.service";

@Module({
  imports: [MulterModule.register({ storage: undefined })],
  controllers: [InventoryController, MedicineController, TransferController],
  providers: [InventoryService, MedicineService, TransferService, QuickAddService],
  exports: [InventoryService, MedicineService, TransferService, QuickAddService],
})
export class InventoryModule {}
