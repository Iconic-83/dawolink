import { Global, Module } from "@nestjs/common";
import { WaafiPayService } from "./waafipay.service";
import { PaymentsController } from "./payments.controller";

@Global()
@Module({
  providers: [WaafiPayService],
  controllers: [PaymentsController],
  exports: [WaafiPayService],
})
export class PaymentsModule {}
