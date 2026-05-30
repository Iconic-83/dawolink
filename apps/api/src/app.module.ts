import { join } from "path";
import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./common/database/database.module";
import { MailModule } from "./common/mail/mail.module";
import { HealthController } from "./common/health/health.controller";
import { AuthModule } from "./auth/auth.module";
import { InventoryModule } from "./inventory/inventory.module";
import { PosModule } from "./pos/pos.module";
import { SupplierModule } from "./supplier/supplier.module";
import { ExpiryModule } from "./expiry/expiry.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { PharmacyModule } from "./pharmacy/pharmacy.module";
import { PlatformModule } from "./platform/platform.module";
import { RbacModule } from "./rbac/rbac.module";
import { GlobalMedicineModule } from "./global-medicine/global-medicine.module";
import { BillingModule } from "./billing/billing.module";
import { AuditModule } from "./audit/audit.module";
import { CustomerModule } from "./customer/customer.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { OrderModule } from "./order/order.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PushModule } from "./push/push.module";
import { InboxModule } from "./inbox/inbox.module";
import { ChatModule } from "./chat/chat.module";
import { DriverModule } from "./driver/driver.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { SupplierPortalModule } from "./supplier-portal/supplier-portal.module";
import { PaymentsModule } from "./payments/payments.module";
import { StorageModule } from "./common/storage/storage.module";

@Module({
  controllers: [HealthController],
  imports: [
    ServeStaticModule.forRoot({ rootPath: join(process.cwd(), "uploads"), serveRoot: "/uploads" }),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    StorageModule,
    AuditModule,
    AuthModule,
    RbacModule,
    GlobalMedicineModule,
    BillingModule,
    PlatformModule,
    PharmacyModule,
    InventoryModule,
    PosModule,
    SupplierModule,
    ExpiryModule,
    AnalyticsModule,
    CustomerModule,
    MailModule,
    NotificationsModule,
    PushModule,
    InboxModule,
    ChatModule,
    DriverModule,
    LoyaltyModule,
    PromotionsModule,
    SupplierPortalModule,
    PaymentsModule,
    MarketplaceModule,
    OrderModule,
  ],
})
export class AppModule {}
