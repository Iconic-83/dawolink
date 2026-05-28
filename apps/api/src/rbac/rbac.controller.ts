import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { RbacService } from "./rbac.service";
import { CreateRoleDto } from "./dto/create-role.dto";

@ApiTags("RBAC")
@Controller("v1/rbac")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RbacController {
  constructor(private rbac: RbacService) {}

  @Get("permissions")
  @ApiOperation({ summary: "List all available permissions" })
  listPermissions() {
    return this.rbac.listPermissions();
  }

  @Get("roles")
  @ApiOperation({ summary: "List pharmacy roles" })
  listRoles(@Req() req: any) {
    return this.rbac.listRoles(req.user.pharmacyId);
  }

  @Post("roles")
  @Roles("PHARMACY_OWNER", "BRANCH_MANAGER")
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Create custom role" })
  createRole(@Req() req: any, @Body() dto: CreateRoleDto) {
    return this.rbac.createRole(req.user.pharmacyId, dto);
  }

  @Put("roles/:id")
  @Roles("PHARMACY_OWNER", "BRANCH_MANAGER")
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Update custom role" })
  updateRole(@Req() req: any, @Param("id") id: string, @Body() dto: CreateRoleDto) {
    return this.rbac.updateRole(req.user.pharmacyId, id, dto);
  }

  @Delete("roles/:id")
  @Roles("PHARMACY_OWNER")
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Delete custom role" })
  deleteRole(@Req() req: any, @Param("id") id: string) {
    return this.rbac.deleteRole(req.user.pharmacyId, id);
  }
}
