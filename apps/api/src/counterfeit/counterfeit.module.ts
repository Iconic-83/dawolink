import { Module } from "@nestjs/common";
import { CounterfeitService } from "./counterfeit.service";
import { CounterfeitController } from "./counterfeit.controller";

@Module({
  controllers: [CounterfeitController],
  providers: [CounterfeitService],
  exports: [CounterfeitService],
})
export class CounterfeitModule {}
