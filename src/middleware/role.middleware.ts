import { Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AuthRequest } from "./auth.middleware";
import { resolveRequestRole } from "../utils/role.utils";

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());
    const resolvedRole = resolveRequestRole(req).toLowerCase();
    const hasRole = normalizedAllowedRoles.includes(resolvedRole);

    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}

const userRepo = AppDataSource.getRepository(User);

const loadCurrentUserWithPermissions = async (req: AuthRequest) => {
  const userId = typeof req.user?.id === "string" ? req.user.id : undefined;
  const userEmail =
    typeof req.user?.email === "string"
      ? req.user.email.trim().toLowerCase()
      : undefined;
  const cognitoSub =
    typeof req.user?.sub === "string" ? req.user.sub.trim() : undefined;

  if (!userId && !userEmail && !cognitoSub) {
    return null;
  }

  return userRepo.findOne({
    where: [
      userId ? { id: userId } : undefined,
      userEmail ? { email: userEmail } : undefined,
      cognitoSub ? { cognitoSub } : undefined,
    ].filter(Boolean) as Array<{
      id?: string;
      email?: string;
      cognitoSub?: string;
    }>,
    relations: ["role", "role.permissions"],
  });
};

export function authorizePermissions(...requiredPermissions: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const normalizedRequiredPermissions = requiredPermissions
      .map((permission) => permission.trim().toLowerCase())
      .filter(Boolean);

    if (!normalizedRequiredPermissions.length) {
      return next();
    }

    try {
      const currentUser = await loadCurrentUserWithPermissions(req);

      if (!currentUser?.isActive || !currentUser.role) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const permissionNames = (currentUser.role.permissions ?? [])
        .map((permission) => permission.name?.trim().toLowerCase())
        .filter((permission): permission is string => Boolean(permission));

      const hasPermission = normalizedRequiredPermissions.every((permission) =>
        permissionNames.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch {
      return res.status(500).json({ message: "Failed to verify permissions" });
    }
  };
}
