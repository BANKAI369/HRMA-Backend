import { AppDataSource } from "../config/data-source";
import { Organization } from "../entities/Organization";
import { Tenant } from "../entities/Tenant";

export async function resolvePrimaryTenant() {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  return tenantRepo.findOne({
    where: { isActive: true },
    relations: ["organizations"],
    order: { createdAt: "ASC" },
  });
}

export async function resolvePrimaryOrganization(tenantId?: string | null) {
  const organizationRepo = AppDataSource.getRepository(Organization);

  if (!tenantId) {
    return organizationRepo.findOne({
      order: { createdAt: "ASC" },
    });
  }

  return organizationRepo.findOne({
    where: { tenantId },
    order: { createdAt: "ASC" },
  });
}
