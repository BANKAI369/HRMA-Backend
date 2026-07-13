import { User } from "../entities/User";

export const serializeAuthUser = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  isActive: user.isActive,
  mustChangePassword: user.mustChangePassword,
  role: user.role
    ? {
        id: user.role.id,
        name: user.role.name,
      }
    : null,
  roles: (user.roles ?? []).map((role) => ({
    id: role.id,
    name: role.name,
  })),
  department: user.department
    ? {
        id: user.department.id,
        name: user.department.name,
      }
    : null,
  tenant: user.tenant
    ? {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      }
    : null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
