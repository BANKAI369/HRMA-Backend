import { AppDataSource } from "../config/data-source";
import bcrypt from "bcryptjs";
import { User } from "../entities/User";
import { Role } from "../entities/role";

export const seedSuperAdmin = async () => {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);

  const email = process.env.SUPER_ADMIN_EMAIL;
  const username = process.env.SUPER_ADMIN_USERNAME;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !username || !password) {
    throw new Error(
      "Missing SUPER_ADMIN environment variables"
    );
  }

  // role lookup (case-insensitive)
  const roles = await roleRepo.find();

  const superAdminRole = roles.find(
    (role) => role.name.toLowerCase() === "superadmin"
  );

  if (!superAdminRole) {
    throw new Error(
      "SuperAdmin role not found. Seed roles first."
    );
  }

  const existingUser = await userRepo.findOne({
    where: { email },
  });

  if (existingUser) {
    console.log("Super admin already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  const superAdmin = userRepo.create({
    username,
    email,
    password: hashedPassword,
    mustChangePassword: false,
    isActive: true,
    role: superAdminRole,
    roles: [superAdminRole],
  });

  await userRepo.save(superAdmin);

  console.log("Super admin seeded successfully.");
};
