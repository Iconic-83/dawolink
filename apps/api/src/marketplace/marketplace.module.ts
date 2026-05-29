import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { MarketplaceController } from "./marketplace.controller";
import { MarketplaceService } from "./marketplace.service";
import { DatabaseModule } from "../common/database/database.module";
import { CustomerGuard } from "./guards/customer.guard";

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_SECRET"),
        signOptions: { expiresIn: config.get("JWT_EXPIRES_IN", "30d") },
      }),
    }),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, CustomerGuard],
})
export class MarketplaceModule {}
