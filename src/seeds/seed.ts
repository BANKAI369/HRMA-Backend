import { AppDataSource } from "../config/data-source";
import { seedRBAC } from "./rbac.seed";
import { seedAdmin } from "./admin.seed";
import { seedSuperAdmin } from "./superadmin.seed";

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    await seedRBAC();
    await seedSuperAdmin();
    await seedAdmin();
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

runSeeds();
