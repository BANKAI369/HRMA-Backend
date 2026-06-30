import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { AppDataSource } from "../config/data-source";
import { OrganizationInvite } from "../entities/OrganizationInvite";
import { Role } from "../entities/role";
import { User } from "../entities/User";
import { Roles } from "../utils/roles.enum";
import { signAuthToken } from "../utils/jwt.utils";
import { serializeAuthUser } from "../utils/user.serializer";

const inviteRepo = AppDataSource.getRepository(OrganizationInvite);
const roleRepo = AppDataSource.getRepository(Role);
const userRepo = AppDataSource.getRepository(User);

const INVITE_TTL_DAYS = 7;

const normalizeRoleName = (value?: string | null) => {
  if (!value) {
    return Roles.Employee;
  }

  const match = Object.values(Roles).find(
    (role) => role.toLowerCase() === value.trim().toLowerCase()
  );

  return match ?? Roles.Employee;
};

const buildInviteResponse = (invite: OrganizationInvite) => ({
  id: invite.id,
  email: invite.email,
  roleName: invite.roleName,
  status: invite.status,
  token: invite.token,
  tenantId: invite.tenantId,
  organizationId: invite.organizationId,
  invitedByUserId: invite.invitedByUserId,
  acceptedByUserId: invite.acceptedByUserId,
  expiresAt: invite.expiresAt,
  acceptedAt: invite.acceptedAt,
  createdAt: invite.createdAt,
  updatedAt: invite.updatedAt,
});

export class InviteService {
  async listInvites(scope: { tenantId: string; organizationId: string }) {
    const invites = await inviteRepo.find({
      where: {
        tenantId: scope.tenantId,
        organizationId: scope.organizationId,
      },
      order: { createdAt: "DESC" },
    });

    return invites.map(buildInviteResponse);
  }

  async createInvite(data: {
    tenantId: string;
    organizationId: string;
    email: string;
    roleName?: string | null;
    invitedByUserId?: string | null;
  }) {
    const email = data.email.trim().toLowerCase();
    const roleName = normalizeRoleName(data.roleName);

    const existingActiveInvite = await inviteRepo.findOne({
      where: {
        tenantId: data.tenantId,
        organizationId: data.organizationId,
        email,
        status: "pending",
      },
    });

    if (existingActiveInvite && existingActiveInvite.expiresAt > new Date()) {
      throw new Error("An active invite already exists for this email.");
    }

    const existingUser = await userRepo.findOne({
      where: {
        tenantId: data.tenantId,
        email,
      },
    });

    if (existingUser) {
      throw new Error("A user with this email already exists in the organization.");
    }

    const invite = await inviteRepo.save(
      inviteRepo.create({
        tenantId: data.tenantId,
        organizationId: data.organizationId,
        email,
        roleName,
        token: randomUUID().replace(/-/g, ""),
        status: "pending",
        invitedByUserId: data.invitedByUserId ?? null,
        acceptedByUserId: null,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
        acceptedAt: null,
      })
    );

    return buildInviteResponse(invite);
  }

  async getInviteByToken(token: string) {
    const invite = await inviteRepo.findOne({
      where: { token },
    });

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status === "accepted") {
      throw new Error("This invite has already been accepted.");
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      invite.status = "expired";
      await inviteRepo.save(invite);
      throw new Error("This invite has expired.");
    }

    return buildInviteResponse(invite);
  }

  async acceptInvite(token: string, data: { username: string; password: string }) {
    const invite = await inviteRepo.findOne({
      where: { token },
      relations: ["tenant", "organization"],
    });

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status === "accepted") {
      throw new Error("This invite has already been accepted.");
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      invite.status = "expired";
      await inviteRepo.save(invite);
      throw new Error("This invite has expired.");
    }

    const existingUser = await userRepo.findOne({
      where: {
        tenantId: invite.tenantId,
        email: invite.email,
      },
      relations: ["role", "roles", "department", "tenant"],
    });

    if (existingUser) {
      throw new Error("A user with this email already exists in the organization.");
    }

    const role = await roleRepo.findOne({
      where: { name: normalizeRoleName(invite.roleName) },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await userRepo.save(
      userRepo.create({
        username: data.username.trim(),
        email: invite.email,
        password: hashedPassword,
        mustChangePassword: false,
        isActive: true,
        tenant: invite.tenant,
        tenantId: invite.tenantId,
        role,
        roleId: role.id,
        roles: [role],
      })
    );

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    invite.acceptedByUserId = user.id;
    await inviteRepo.save(invite);

    const fullUser = await userRepo.findOneOrFail({
      where: { id: user.id },
      relations: ["role", "roles", "department", "tenant"],
    });

    return {
      token: signAuthToken(fullUser),
      user: serializeAuthUser(fullUser),
      message: "Invitation accepted",
    };
  }
}
