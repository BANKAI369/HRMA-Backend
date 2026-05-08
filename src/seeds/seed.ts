import { initializeDatabase } from "../config/database";
import { seedRBAC } from "./rbac.seed";
import { seedAdmin } from "./admin.seed";
import { seedSuperAdmin } from "./superadmin.seed";

async function runSeeds() {
  try {
    await initializeDatabase();
    await seedRBAC();
    await seedSuperAdmin();
    await seedAdmin();
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

runSeeds();
