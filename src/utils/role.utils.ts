import { AuthRequest } from "../middleware/auth.middleware";
import { Roles } from "./roles.enum";

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

export const resolveRequestRole = (req: AuthRequest): Roles => {
  const directRole = normalizeRole(req.user?.role);
  if (directRole) {
    return directRole;
  }

  return Roles.Employee;
};
