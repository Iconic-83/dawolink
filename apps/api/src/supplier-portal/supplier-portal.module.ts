import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SupplierPortalService } from "./supplier-portal.service";
import { SupplierPortalController } from "./supplier-portal.controller";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_SECRET"),
        signOptions: { expiresIn: config.get("JWT_EXPIRES_IN", "7d") },
      }),
    }),
  ],
  providers: [SupplierPortalService],
  controllers: [SupplierPortalController],
})
export class SupplierPortalModule {}
