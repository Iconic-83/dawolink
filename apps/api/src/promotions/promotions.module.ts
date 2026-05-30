import { Global, Module } from "@nestjs/common";
import { PromotionsService } from "./promotions.service";
import { PromotionsController } from "./promotions.controller";

@Global()
@Module({
  providers: [PromotionsService],
  controllers: [PromotionsController],
  exports: [PromotionsService],
})
export class PromotionsModule {}
