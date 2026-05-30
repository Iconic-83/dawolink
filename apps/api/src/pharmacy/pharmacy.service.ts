import { Injectable, NotFoundException, ForbiddenException, ConflictException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../common/database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreatePharmacyDto } from "./dto/create-pharmacy.dto";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { UpdatePharmacyDto } from "./dto/update-pharmacy.dto";
import { UpdatePharmacySettingsDto } from "./dto/update-pharmacy-settings.dto";
import { CreateInviteDto } from "./dto/create-invite.dto";
import { MailService } from "../common/mail/mail.service";
import { UpdateStaffDto } from "./dto/update-staff.dto";
import { PLAN_LIMITS } from "../common/guards/plan.guard";
import { InboxService } from "../inbox/inbox.service";

@Injectable()
export class PharmacyService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private mail: MailService,
    private inbox: InboxService,
  ) {}

  async create(dto: CreatePharmacyDto) {
    return this.prisma.pharmacy.create({ data: dto });
  }

  async findOne(id: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id },
      include: { branches: true },
    });
    if (!pharmacy) throw new NotFoundException("Pharmacy not found");
    return pharmacy;
  }

  async createBranch(pharmacyId: string, actorId: string, dto: CreateBranchDto) {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: pharmacyId }, select: { plan: true } });
    const limit = PLAN_LIMITS[pharmacy?.plan ?? "STARTER"].branches;
    const count = await this.prisma.branch.count({ where: { pharmacyId, isActive: true } });
    if (count >= limit) {
      throw new ForbiddenException(`Your ${pharmacy?.plan} plan allows up to ${limit} branch${limit === 1 ? "" : "es"}. Upgrade to add more.`);
    }
    const branch = await this.prisma.branch.create({ data: { ...dto, pharmacyId } });

    this.audit.log({
      pharmacyId,
      userId: actorId,
      action: "BRANCH_CREATED",
      entity: "Branch",
      entityId: branch.id,
      newValue: { name: branch.name, address: branch.address },
    });

    return branch;
  }

  async getBranches(pharmacyId: string) {
    return this.prisma.branch.findMany({
      where: { pharmacyId, isActive: true },
      orderBy: { isMain: "desc" },
    });
  }

  async getStaff(pharmacyId: string, actorRole?: string, actorBranchId?: string) {
    return this.prisma.user.findMany({
      where: {
        pharmacyId,
        // Branch managers only see their own branch
        ...(actorRole === "BRANCH_MANAGER" && actorBranchId
          ? { branchId: actorBranchId }
          : {}),
      },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, phone: true, role: true,
        branchId: true, lastLoginAt: true, isActive: true, createdAt: true,
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateStaff(pharmacyId: string, actorId: string, targetUserId: string, dto: UpdateStaffDto) {
    const user = await this.prisma.user.findFirst({ where: { id: targetUserId, pharmacyId } });
    if (!user) throw new NotFoundException("Staff member not found");
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: dto,
      select: {
        id: true, firstName: true, lastName: true,
        email: true, phone: true, role: true,
        branchId: true, isActive: true,
        branch: { select: { name: true } },
      },
    });

    const action = dto.isActive === false ? "STAFF_DEACTIVATED"
      : dto.isActive === true ? "STAFF_REACTIVATED"
      : "STAFF_UPDATED";

    this.audit.log({
      pharmacyId,
      userId: actorId,
      action,
      entity: "User",
      entityId: targetUserId,
      oldValue: { role: user.role, isActive: user.isActive, branchId: user.branchId },
      newValue: { ...dto, email: user.email, name: `${user.firstName} ${user.lastName}` },
    });

    return updated;
  }

  async deactivateStaff(pharmacyId: string, actorId: string, userId: string) {
    return this.updateStaff(pharmacyId, actorId, userId, { isActive: false });
  }

  async reactivateStaff(pharmacyId: string, actorId: string, userId: string) {
    return this.updateStaff(pharmacyId, actorId, userId, { isActive: true });
  }

  async updateProfile(pharmacyId: string, actorId: string, dto: UpdatePharmacyDto) {
    const updated = await this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: dto,
      include: { branches: { where: { isActive: true } } },
    });

    this.audit.log({
      pharmacyId,
      userId: actorId,
      action: "PHARMACY_UPDATED",
      entity: "Pharmacy",
      entityId: pharmacyId,
      newValue: dto as any,
    });

    return updated;
  }

  async updateLogo(pharmacyId: string, logoUrl: string) {
    return this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: { logoUrl },
      select: { id: true, logoUrl: true },
    });
  }

  async updateBranch(pharmacyId: string, actorId: string, branchId: string, dto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, pharmacyId } });
    if (!branch) throw new NotFoundException("Branch not found");
    const updated = await this.prisma.branch.update({ where: { id: branchId }, data: dto });

    this.audit.log({
      pharmacyId,
      userId: actorId,
      action: "BRANCH_UPDATED",
      entity: "Branch",
      entityId: branchId,
      oldValue: { name: branch.name, address: branch.address },
      newValue: dto as any,
    });

    return updated;
  }

  async deactivateBranch(pharmacyId: string, actorId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, pharmacyId } });
    if (!branch) throw new NotFoundException("Branch not found");
    if (branch.isMain) throw new ForbiddenException("Cannot deactivate the main branch");
    const updated = await this.prisma.branch.update({ where: { id: branchId }, data: { isActive: false } });

    this.audit.log({
      pharmacyId,
      userId: actorId,
      action: "BRANCH_DEACTIVATED",
      entity: "Branch",
      entityId: branchId,
      newValue: { name: branch.name },
    });

    return updated;
  }

  // ── Staff invites ──────────────────────────────────────────────────────────

  async createInvite(
    pharmacyId: string,
    invitedById: string,
    dto: CreateInviteDto,
    frontendUrl: string,
  ) {
    // Check not already a staff member
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email, pharmacyId } });
    if (existing) throw new ConflictException("This email already belongs to a staff member");

    // Revoke any existing pending invite for this email+pharmacy
    await this.prisma.staffInvite.deleteMany({
      where: { pharmacyId, email: dto.email, acceptedAt: null },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await this.prisma.staffInvite.create({
      data: { pharmacyId, email: dto.email, role: dto.role, branchId: dto.branchId, token, invitedById, expiresAt },
      include: { pharmacy: { select: { name: true } }, invitedBy: { select: { firstName: true, lastName: true } } },
    });

    const inviteUrl = `${frontendUrl}/invite/${token}`;

    // Send email (fire-and-forget; MailService silently skips if SMTP not configured)
    this.mail.sendStaffInvite({
      to: dto.email,
      pharmacyName: invite.pharmacy.name,
      invitedByName: `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}`,
      role: dto.role,
      inviteUrl,
      expiresAt,
    });

    this.audit.log({
      pharmacyId,
      userId: invitedById,
      action: "STAFF_INVITED",
      entity: "StaffInvite",
      entityId: invite.id,
      newValue: { email: dto.email, role: dto.role, branchId: dto.branchId, expiresAt: expiresAt.toISOString() },
    });

    this.inbox.push(
      pharmacyId,
      "STAFF_INVITE",
      "Staff Invitation Sent",
      `An invitation was sent to ${dto.email} for the ${dto.role.replace(/_/g, " ")} role.`,
      "/staff",
    );

    return { invite, inviteUrl, emailSent: this.mail.isEnabled };
  }

  listInvites(pharmacyId: string) {
    return this.prisma.staffInvite.findMany({
      where: { pharmacyId, acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { invitedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async revokeInvite(pharmacyId: string, actorId: string, id: string) {
    const invite = await this.prisma.staffInvite.findFirst({ where: { id, pharmacyId } });
    if (!invite) throw new NotFoundException("Invite not found");
    await this.prisma.staffInvite.delete({ where: { id } });

    this.audit.log({
      pharmacyId,
      userId: actorId,
      action: "INVITE_REVOKED",
      entity: "StaffInvite",
      entityId: id,
      newValue: { email: invite.email, role: invite.role },
    });

    return { success: true };
  }

  // Public — used by accept page
  async getInviteByToken(token: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { token },
      include: { pharmacy: { select: { name: true, city: true, logoUrl: true } } },
    });
    if (!invite) throw new NotFoundException("Invalid or expired invite link");
    if (invite.acceptedAt) throw new ConflictException("This invitation has already been used");
    if (invite.expiresAt < new Date()) throw new ConflictException("This invitation has expired");
    return invite;
  }

  // ── Pharmacy Settings ──────────────────────────────────────────────────────

  async getSettings(pharmacyId: string) {
    const settings = await this.prisma.pharmacySettings.findUnique({ where: { pharmacyId } });
    if (settings) return settings;
    return this.prisma.pharmacySettings.create({ data: { pharmacyId } });
  }

  async updateSettings(pharmacyId: string, actorId: string, dto: UpdatePharmacySettingsDto) {
    const old = await this.getSettings(pharmacyId);
    const settings = await this.prisma.pharmacySettings.upsert({
      where: { pharmacyId },
      update: dto,
      create: { pharmacyId, ...dto },
    });

    this.audit.log({
      pharmacyId,
      userId: actorId,
      action: "SETTINGS_UPDATED",
      entity: "PharmacySettings",
      entityId: settings.id,
      oldValue: old as any,
      newValue: settings as any,
    });

    return settings;
  }
}
