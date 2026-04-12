import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/role";
import { Permission } from "../entities/permission";

export const seedRBAC = async () => {
  const roleRepo = AppDataSource.getRepository(Role);
  const permissionRepo = AppDataSource.getRepository(Permission);

  console.log("🌱 Seeding NEST access control...");

  // 1️⃣ Create Permissions
  const permissionsList = [
    "create_user",
    "update_user",
    "delete_user",
    "view_users",
    "assign_role",
    "manage_roles",
    "view_roles",
    "view_permissions",
    "assign_role_permissions",
    "create_department",
    "update_department",
    "delete_department",
    "view_departments",
    "view_self",
  ];

  const permissionEntities: Permission[] = [];

  for (const perm of permissionsList) {
    let permission = await permissionRepo.findOne({ where: { name: perm } });

    if (!permission) {
      permission = permissionRepo.create({ name: perm });
      await permissionRepo.save(permission);
    }

    permissionEntities.push(permission);
  }

  const rolesList = ["Admin", "Manager", "Employee"];
  const roleEntities: Record<string, Role> = {};

  for (const roleName of rolesList) {
    let role = await roleRepo.findOne({ where: { name: roleName } });

    if (!role) {
      role = roleRepo.create({ name: roleName });
      await roleRepo.save(role);
    }

    roleEntities[roleName] = role;
  }

  const adminPermissions = permissionEntities;
  const managerPermissions = permissionEntities.filter((p) =>
    ["create_user", "update_user", "view_users", "view_self"].includes(p.name)
  );
  const employeePermissions = permissionEntities.filter(
    (p) => p.name === "view_self"
  );

  roleEntities["Admin"].permissions = adminPermissions;
  roleEntities["Manager"].permissions = managerPermissions;
  roleEntities["Employee"].permissions = employeePermissions;

  await roleRepo.save(roleEntities["Admin"]);
  await roleRepo.save(roleEntities["Manager"]);
  await roleRepo.save(roleEntities["Employee"]);
<<<<<<< Updated upstream
=======

  console.log("NEST access control seed completed");
>>>>>>> Stashed changes
};
