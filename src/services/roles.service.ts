import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Permission } from "../entities/permission";
import { Role } from "../entities/role";
import { User } from "../entities/User";

const roleRepository = AppDataSource.getRepository(Role);
const userRepository = AppDataSource.getRepository(User);
const permissionRepository = AppDataSource.getRepository(Permission);

export async function createRole(name: string) {
  const existing = await roleRepository.findOne({ where: { name } });
  if (existing) {
    throw new Error("Role already exists");
  }

  const role = roleRepository.create({ name, permissions: [] });
  return await roleRepository.save(role);
}

export async function findAllRoles() {
  return await roleRepository.find({
    relations: ["permissions"],
  });
}

export async function findRoleById(id: string) {
  const role = await roleRepository.findOne({
    where: { id },
    relations: ["permissions"],
  });
  if (!role) {
    throw new Error("Role not found");
  }
  return role;
}

export async function deleteRole(id: string) {
  const role = await findRoleById(id);
  await roleRepository.remove(role);
  return { message: "Role deleted successfully" };
}

export async function assignRoleToUser(userId: string, roleName: string) {
  const user = await userRepository.findOne({
    where: { id: userId },
    relations: ["role"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  const role = await roleRepository.findOne({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  if (user.role?.id === role.id) {
    throw new Error("User already has this role");
  }

  user.role = role;
  return userRepository.save(user);
}

async function findPermissionsByIds(permissionIds: string[]) {
  const normalizedIds = [...new Set(permissionIds.map((id) => id.trim()))].filter(Boolean);

  const permissions = normalizedIds.length
    ? await permissionRepository.find({
        where: { id: In(normalizedIds) },
      })
    : [];

  if (permissions.length !== normalizedIds.length) {
    throw new Error("One or more permissions were not found");
  }

  return permissions;
}

export async function assignPermissionsToRole(
  roleId: string,
  permissionIds: string[]
) {
  const role = await findRoleById(roleId);
  const permissionsToAssign = await findPermissionsByIds(permissionIds);
  const existingPermissions = role.permissions ?? [];
  const mergedPermissions = [
    ...existingPermissions,
    ...permissionsToAssign.filter(
      (permission) =>
        !existingPermissions.some(
          (existingPermission) => existingPermission.id === permission.id
        )
    ),
  ];

  role.permissions = mergedPermissions;
  return roleRepository.save(role);
}

export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
) {
  const role = await findRoleById(roleId);
  const permissions = await findPermissionsByIds(permissionIds);

  role.permissions = permissions;
  return roleRepository.save(role);
}
