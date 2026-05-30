import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DoctorService } from "./doctor.service";
import { DoctorController } from "./doctor.controller";
import { DoctorJwtGuard } from "./doctor-jwt.guard";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_SECRET"),
        signOptions: { expiresIn: config.get("JWT_EXPIRES_IN", "7d") },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DoctorController],
  providers: [DoctorService, DoctorJwtGuard],
  exports: [DoctorService, DoctorJwtGuard],
})
export class DoctorModule {}
