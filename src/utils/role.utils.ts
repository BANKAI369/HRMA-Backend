import { AuthRequest } from "../middleware/auth.middleware";
import { Roles } from "./roles.enum";

const ROLE_PRIORITY = [Roles.SuperAdmin, Roles.Admin, Roles.Manager, Roles.Employee];

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

export const isSuperAdminRole = (value: unknown) =>
  normalizeRole(value) === Roles.SuperAdmin;

export const resolveRequestRoles = (req: AuthRequest): Roles[] => {
  const tokenRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const allRoles = [req.user?.role, ...tokenRoles]
    .map((value) => normalizeRole(value))
    .filter((role): role is Roles => Boolean(role));

  return [...new Set(allRoles)];
};

  return Roles.Employee;
};
