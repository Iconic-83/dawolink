import { Global, Module } from "@nestjs/common";
import { PushService } from "./push.service";
import { DatabaseModule } from "../common/database/database.module";

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
