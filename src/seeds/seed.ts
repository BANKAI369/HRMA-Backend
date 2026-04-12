import { AppDataSource } from "../config/data-source";
<<<<<<< Updated upstream
import { seedRBAC } from "./rbac.seed";
import { seedAdmin } from "./admin.seed";
=======
import { Role } from "../entities/role";
import { User } from "../entities/User";
import { seedRBAC } from "./rbac.seed";
import { Roles } from "../utils/roles.enum";

const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const DEFAULT_ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@nest.local";
const DEFAULT_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "Admin@123";

const ensureRole = async (roleName: Roles) => {
  const roleRepo = AppDataSource.getRepository(Role);
  const existingRole = await roleRepo.findOne({
    where: { name: roleName },
  });

  if (existingRole) {
    return existingRole;
  }

  return roleRepo.save(
    roleRepo.create({
      name: roleName,
    })
  );
};

const seedRoles = async () => {
  const roles = [Roles.Admin, Roles.Manager, Roles.Employee];

  for (const roleName of roles) {
    await ensureRole(roleName);
  }
};

const seedAdmin = async () => {
  const userRepo = AppDataSource.getRepository(User);
  const adminRole = await ensureRole(Roles.Admin);
  const normalizedEmail = DEFAULT_ADMIN_EMAIL.trim().toLowerCase();
  const normalizedUsername = DEFAULT_ADMIN_USERNAME.trim();

  const existingAdmin = await userRepo.findOne({
    where: [{ email: normalizedEmail }, { username: normalizedUsername }],
    relations: ["role"],
  });

  if (existingAdmin) {
    if (!existingAdmin.role || existingAdmin.role.name !== Roles.Admin) {
      existingAdmin.role = adminRole;
      existingAdmin.roleId = adminRole.id;
      existingAdmin.isActive = true;
      existingAdmin.mustChangePassword = false;
      await userRepo.save(existingAdmin);
      console.log(
        `Updated existing user "${normalizedEmail}" with Admin role.`
      );
    } else {
      console.log(`Admin user already exists for "${normalizedEmail}".`);
    }

    return;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  const adminUser = userRepo.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword,
    mustChangePassword: false,
    isActive: true,
    role: adminRole,
    roleId: adminRole.id,
  });

  await userRepo.save(adminUser);

  console.log(`Seeded admin user "${normalizedEmail}".`);
  console.log(
    "If needed, override ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD in Backend/.env before seeding."
  );
};

const runSeed = async () => {
  await AppDataSource.initialize();
>>>>>>> Stashed changes

async function runSeeds() {
  try {
<<<<<<< Updated upstream
    await AppDataSource.initialize();
=======
    await seedRoles();
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    await seedRBAC();
    await seedAdmin();
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

runSeeds();
