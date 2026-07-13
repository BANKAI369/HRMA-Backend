import { AppDataSource } from "../config/data-source";
import { Permission } from "../entities/permission";
import { Module } from "../entities/Module";
import { Role } from "../entities/role";
import { In } from "typeorm";

/**
 * Seeds the Leave Type related permissions and ensures the Leave Management module exists.
 */
export async function seedLeaveTypePermissions() {
  const permissionRepo = AppDataSource.getRepository(Permission);
  const moduleRepo = AppDataSource.getRepository(Module);
  const roleRepo = AppDataSource.getRepository(Role);

  // 1. Ensure the Leave Management module exists to group these permissions
  let leaveModule = await moduleRepo.findOne({ where: { code: "leave_management" } });
  
  if (!leaveModule) {
    leaveModule = await moduleRepo.save(
      moduleRepo.create({
        code: "leave_management",
        name: "Leave Management",
        description: "Module for managing employee leave types, quotas, and requests.",
        isActive: true,
      })
    );
  }

  const permissionsToSeed = [
    { name: "leave_type.create", description: "Allows creating new leave types (e.g., Sick, Casual)" },
    { name: "leave_type.view", description: "Allows viewing the list and details of leave types" },
    { name: "leave_type.update", description: "Allows editing existing leave type configurations" },
    { name: "leave_type.delete", description: "Allows deactivating or removing leave types" },
    { name: "leave_policy.create", description: "Allows creating leave policies" },
    { name: "leave_policy.view", description: "Allows viewing leave policies" },
    { name: "leave_policy.update", description: "Allows updating leave policies" },
    { name: "leave_policy.delete", description: "Allows deleting leave policies" },
    { name: "leave_policy_rule.create", description: "Allows creating rules within a leave policy" },
    { name: "leave_policy_rule.update", description: "Allows updating leave policy rules" },
    { name: "leave_policy_rule.delete", description: "Allows deleting leave policy rules" },
    { name: "leave_policy_rule.create", description: "Allows creating rules within a leave policy" },
    { name: "leave_policy_rule.update", description: "Allows updating leave policy rules" },
    { name: "leave_policy_rule.delete", description: "Allows deleting leave policy rules" },
    { name: "leave_balance.generate", description: "Allows generating leave balances for employees" },
    { name: "leave_balance.view", description: "Allows viewing calculated leave balances" },
    { name: "leave_balance.update", description: "Allows updating or correcting leave balances" },
    { name: "policy_assignment.create", description: "Allows creating policy assignments (e.g., assigning a leave policy to an employee/department)" },
    { name: "policy_assignment.view", description: "Allows viewing policy assignments and their details" },
    { name: "policy_assignment.update", description: "Allows editing existing policy assignments" },
    { name: "policy_assignment.delete", description: "Allows removing or deactivating policy assignments" },
  ];

  for (const p of permissionsToSeed) {
    const exists = await permissionRepo.findOne({ where: { name: p.name } });
    if (!exists) {
      await permissionRepo.save(
        permissionRepo.create({ ...p, module: leaveModule })
      );
    }
  }

  // 3. Assign permissions to Admin roles (SuperAdmin, Admin, TenantAdmin), Manager, and Employee
  const targetRoles = ["SuperAdmin", "Admin", "TenantAdmin", "Manager", "Employee"];
  const roles = await roleRepo.find({ 
    where: { name: In(targetRoles) },
    relations: ["permissions"]
  });

  if (roles.length > 0) {
    const allLeaveTypePermissions = await permissionRepo.find({
      where: { name: In(permissionsToSeed.map(p => p.name)) }
    });

    for (const role of roles) {
      const existingPermIds = new Set(role.permissions.map(p => p.id));
      let permissionsToAssign: Permission[] = [];

      if (role.name === "Manager" || role.name === "Employee") {
        permissionsToAssign = allLeaveTypePermissions.filter(p =>
          p.name === "leave_type.view" || p.name === "leave_policy.view" || p.name === "leave_policy_rule.view" || p.name === "policy_assignment.view"
        );
      } else {
        permissionsToAssign = allLeaveTypePermissions;
      }
      const permsToAdd = permissionsToAssign.filter(p => !existingPermIds.has(p.id));
      role.permissions.push(...permsToAdd);
      await roleRepo.save(role);
    }
  }
}
