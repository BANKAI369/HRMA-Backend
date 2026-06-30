import jwt from "jsonwebtoken";
import { User } from "../entities/User";

const DEFAULT_JWT_SECRET = "hrma-dev-secret";

export const getJwtSecret = () => process.env.JWT_SECRET?.trim() || DEFAULT_JWT_SECRET;

<<<<<<< HEAD
const getTokenRoles = (user: User) => {
  const roles = user.roles?.length ? user.roles : user.role ? [user.role] : [];
  return [...new Set(roles.map((role) => role.name).filter(Boolean))];
};

=======
>>>>>>> 5d05ed33fe7ba54133d7769201aef82cfbfdf950
export const signAuthToken = (user: User) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
<<<<<<< HEAD
      tenantId: user.tenantId,
      role: user.role?.name || user.roles?.[0]?.name || "Employee",
      roles: getTokenRoles(user),
=======
      role: user.role?.name || "Employee",
>>>>>>> 5d05ed33fe7ba54133d7769201aef82cfbfdf950
    },
    getJwtSecret(),
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
    }
  );
