import { Global, Module } from "@nestjs/common";
import { InboxService } from "./inbox.service";
import { InboxController } from "./inbox.controller";

@Global()
@Module({
  providers: [InboxService],
  controllers: [InboxController],
  exports: [InboxService],
})
export class InboxModule {}
