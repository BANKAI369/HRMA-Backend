import { initializeDatabase } from "../config/database";
import { seedRBAC } from "./rbac.seed";
import { seedAdmin } from "./admin.seed";
import { seedSuperAdmin } from "./superadmin.seed";

const runSeeds = async () => {
  await initializeDatabase();
  await seedRBAC();
  await seedSuperAdmin();
  await seedAdmin();
  process.exit(0);
};

runSeeds().catch(() => {
  process.exit(1);
});
