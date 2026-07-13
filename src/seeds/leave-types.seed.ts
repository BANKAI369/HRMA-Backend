import { AppDataSource } from "../config/data-source";
import { Tenant } from "../entities/Tenant";

export const seedLeaveTypes = async () => {
  const tenantRepo = AppDataSource.getRepository(Tenant);

  console.log("Seeding leave types...");

  let tenant = await tenantRepo.findOne({ where: {} });
  if (!tenant) {
    tenant = tenantRepo.create({ name: "Default Tenant", slug: "default", isActive: true });
    await tenantRepo.save(tenant);
  }

  const defaults = [
    { name: "Casual", code: "CASUAL", description: "Casual leave", isPaid: true },
    { name: "Sick", code: "SICK", description: "Sick leave", isPaid: true },
    { name: "Privilege", code: "PRIVILEGE", description: "Privilege leave", isPaid: true },
    { name: "Work From Home", code: "WFH", description: "Work from home", isPaid: true },
  ];

  for (const t of defaults) {
    // remove any existing with same tenant and code to avoid duplicates
    await AppDataSource.manager.query(
      `DELETE FROM leave_types WHERE tenant_id = $1 AND code = $2`,
      [tenant.id, t.code]
    );

    await AppDataSource.manager.query(
      `INSERT INTO leave_types (id, tenant_id, name, code, description, "isPaid", "requiresApproval", "allowHalfDay", "allowHourly", "requiresDocument", "isActive", "createdAt", "updatedAt")
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, false, false, false, true, now(), now())`,
      [tenant.id, t.name, t.code, t.description, t.isPaid]
    );
  }

  console.log("Leave types seed completed");
};
