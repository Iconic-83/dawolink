import { Module } from "@nestjs/common";
import { NationalService } from "./national.service";
import { NationalController } from "./national.controller";
import { MailModule } from "../common/mail/mail.module";

@Module({
  imports: [MailModule],
  controllers: [NationalController],
  providers: [NationalService],
  exports: [NationalService],
})
export class NationalModule {}
