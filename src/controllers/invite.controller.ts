import { Request, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { InviteService } from "../services/invite.service";
import { resolveAuthenticatedUser } from "../utils/auth-user.utils";
import { resolvePrimaryOrganization } from "../utils/tenant.utils";
import { Roles } from "../utils/roles.enum";

const inviteService = new InviteService();

const createInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  roleName: z.enum([Roles.Admin, Roles.Manager, Roles.Employee]).optional(),
});

const tokenParamSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const acceptInviteSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const resolveOrgScope = async (req: AuthRequest) => {
  const currentUser = await resolveAuthenticatedUser(req, [
    "role",
    "roles",
    "tenant",
  ]);

  if (!currentUser?.tenantId) {
    throw new Error("Tenant scope not found");
  }

  const organization = await resolvePrimaryOrganization(currentUser.tenantId);

  if (!organization?.id) {
    throw new Error("Organization scope not found");
  }

  const roleName =
    currentUser.role?.name || currentUser.roles?.[0]?.name || Roles.Employee;

  if (![Roles.Admin, Roles.SuperAdmin].includes(roleName as Roles)) {
    throw new Error("Forbidden");
  }

  return {
    tenantId: currentUser.tenantId,
    organizationId: organization.id,
    actorUserId: currentUser.id,
  };
};

export async function listInvites(req: AuthRequest, res: Response) {
  try {
    const scope = await resolveOrgScope(req);
    return res.status(200).json(await inviteService.listInvites(scope));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load invites";
    return res.status(message === "Forbidden" ? 403 : 400).json({ message });
  }
}

export async function createInvite(req: AuthRequest, res: Response) {
  const parsed = createInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const scope = await resolveOrgScope(req);
    const invite = await inviteService.createInvite({
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      email: parsed.data.email,
      roleName: parsed.data.roleName,
      invitedByUserId: scope.actorUserId,
    });

    return res.status(201).json(invite);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create invite";
    return res.status(message === "Forbidden" ? 403 : 400).json({ message });
  }
}

export async function getInviteByToken(req: Request, res: Response) {
  const parsed = tokenParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(200).json(await inviteService.getInviteByToken(parsed.data.token));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invite lookup failed";
    const status = message.includes("expired") ? 410 : message.includes("not found") ? 404 : 400;
    return res.status(status).json({ message });
  }
}

export async function acceptInvite(req: Request, res: Response) {
  const tokenParsed = tokenParamSchema.safeParse(req.params);
  if (!tokenParsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: tokenParsed.error.flatten().fieldErrors,
    });
  }

  const bodyParsed = acceptInviteSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: bodyParsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res
      .status(200)
      .json(await inviteService.acceptInvite(tokenParsed.data.token, bodyParsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept invite";
    const status = message.includes("expired")
      ? 410
      : message.includes("not found")
        ? 404
        : 400;
    return res.status(status).json({ message });
  }
}
