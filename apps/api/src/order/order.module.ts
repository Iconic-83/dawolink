import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { DatabaseModule } from "../common/database/database.module";
import { JwtStreamGuard } from "./guards/jwt-stream.guard";

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret: c.get("JWT_SECRET"),
        signOptions: { expiresIn: c.get("JWT_EXPIRES_IN", "7d") },
      }),
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService, JwtStreamGuard],
})
export class OrderModule {}
