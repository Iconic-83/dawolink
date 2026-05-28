import { Module } from "@nestjs/common";
import { DatabaseModule } from "../common/database/database.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { BillingCron } from "./billing.cron";

@Module({
  imports: [DatabaseModule],
  controllers: [BillingController],
  providers: [BillingService, BillingCron],
  exports: [BillingService],
})
export class BillingModule {}
