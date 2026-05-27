import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./common/database/database.module";
import { AuthModule } from "./auth/auth.module";
import { InventoryModule } from "./inventory/inventory.module";
import { PosModule } from "./pos/pos.module";
import { SupplierModule } from "./supplier/supplier.module";
import { ExpiryModule } from "./expiry/expiry.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { PharmacyModule } from "./pharmacy/pharmacy.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    PharmacyModule,
    InventoryModule,
    PosModule,
    SupplierModule,
    ExpiryModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
