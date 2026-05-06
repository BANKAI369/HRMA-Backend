import { AuthRequest } from "../middleware/auth.middleware";
import { Roles } from "./roles.enum";

const ROLE_PRIORITY = [Roles.Admin, Roles.Manager, Roles.Employee];

export const normalizeRole = (value: unknown): Roles | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();
  return (
    Object.values(Roles).find(
      (role) => role.toLowerCase() === normalizedValue
    ) || null
  );
};

export const resolveRequestRoles = (req: AuthRequest): Roles[] => {
  const tokenRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const allRoles = [req.user?.role, ...tokenRoles]
    .map((value) => normalizeRole(value))
    .filter((role): role is Roles => Boolean(role));

  return [...new Set(allRoles)];
};

export const resolveRequestRole = (req: AuthRequest): Roles => {
  const roles = resolveRequestRoles(req);

  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return roles[0] ?? Roles.Employee;
};

export const hasRequestRole = (req: AuthRequest, allowedRoles: string[]) => {
  const normalizedAllowedRoles = allowedRoles
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);

  if (!normalizedAllowedRoles.length) {
    return true;
  }

  const requestRoles = resolveRequestRoles(req).map((role) => role.toLowerCase());
  return requestRoles.some((role) => normalizedAllowedRoles.includes(role));
};
