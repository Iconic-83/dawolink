import { Module, Global } from "@nestjs/common";
import { DatabaseModule } from "../common/database/database.module";
import { RbacService } from "./rbac.service";
import { RbacController } from "./rbac.controller";
import { PermissionGuard } from "./permission.guard";

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [RbacController],
  providers: [RbacService, PermissionGuard],
  exports: [RbacService, PermissionGuard],
})
export class RbacModule {}
