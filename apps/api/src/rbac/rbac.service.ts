import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { SYSTEM_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "./rbac.seed";

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  // Seed all system permissions into DB (idempotent — call on startup)
  async seedPermissions() {
    for (const p of SYSTEM_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { key: p.key },
        create: p,
        update: { label: p.label, module: p.module },
      });
    }
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: "asc" }, { key: "asc" }] });
  }

  async listRoles(pharmacyId: string) {
    return this.prisma.customRole.findMany({
      where: { pharmacyId },
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async createRole(pharmacyId: string, dto: CreateRoleDto) {
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: dto.permissionKeys } },
    });

    const existing = await this.prisma.customRole.findFirst({ where: { pharmacyId, name: dto.name } });
    if (existing) throw new ConflictException("Role name already exists");

    return this.prisma.customRole.create({
      data: {
        pharmacyId,
        name: dto.name,
        description: dto.description,
        permissions: {
          create: permissions.map(p => ({ permissionId: p.id })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async updateRole(pharmacyId: string, roleId: string, dto: CreateRoleDto) {
    const role = await this.prisma.customRole.findFirst({ where: { id: roleId, pharmacyId } });
    if (!role) throw new NotFoundException("Role not found");
    if (role.isSystem) throw new ConflictException("Cannot modify system roles");

    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: dto.permissionKeys } },
    });

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });

    return this.prisma.customRole.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        description: dto.description,
        permissions: {
          create: permissions.map(p => ({ permissionId: p.id })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async deleteRole(pharmacyId: string, roleId: string) {
    const role = await this.prisma.customRole.findFirst({ where: { id: roleId, pharmacyId } });
    if (!role) throw new NotFoundException("Role not found");
    if (role.isSystem) throw new ConflictException("Cannot delete system roles");
    return this.prisma.customRole.delete({ where: { id: roleId } });
  }

  // Seed default roles for a newly created pharmacy
  async seedDefaultRoles(pharmacyId: string) {
    const allPermissions = await this.prisma.permission.findMany();
    const permMap = new Map(allPermissions.map(p => [p.key, p.id]));

    for (const [roleName, permKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const keys = permKeys[0] === "*" ? allPermissions.map(p => p.key) : permKeys;
      const permIds = keys.map(k => permMap.get(k)).filter(Boolean) as string[];

      const existing = await this.prisma.customRole.findFirst({ where: { pharmacyId, name: roleName } });
      if (existing) continue;

      await this.prisma.customRole.create({
        data: {
          pharmacyId,
          name: roleName,
          isSystem: true,
          permissions: { create: permIds.map(id => ({ permissionId: id })) },
        },
      });
    }
  }

  // Check if a user has a specific permission (via customRole or base UserRole defaults)
  async userHasPermission(userId: string, permissionKey: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customRole: { include: { permissions: { include: { permission: true } } } },
      },
    });
    if (!user) return false;

    if (user.customRole) {
      return user.customRole.permissions.some(rp => rp.permission.key === permissionKey);
    }

    // Fall back to hardcoded defaults for base UserRole
    const defaults = DEFAULT_ROLE_PERMISSIONS[user.role] ?? [];
    return defaults[0] === "*" || defaults.includes(permissionKey);
  }
}
