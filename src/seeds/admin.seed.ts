import { AppDataSource } from "../config/data-source";
import bcrypt from "bcryptjs";
import { User } from "../entities/User";
import { Role } from "../entities/role";

export const seedAdmin = async () => {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminUsername || !adminPassword) {
    return;
  }

  const adminRole = await roleRepo.findOne({
    where: { name: "Admin" },
  });

  if (!adminRole) {
    return;
  }

  const existingAdmin = await userRepo.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = userRepo.create({
    username: adminUsername,
    email: adminEmail,
    password: hashedPassword,
    mustChangePassword: false,
    isActive: true,
    role: adminRole,
  });

  await userRepo.save(adminUser);
};
