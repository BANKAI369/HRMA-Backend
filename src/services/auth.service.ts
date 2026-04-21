import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/role";
import { Roles } from "../utils/roles.enum";
import bcrypt from "bcryptjs";
import { signAuthToken } from "../utils/jwt.utils";

const userRepo = AppDataSource.getRepository(User);
const roleRepo = AppDataSource.getRepository(Role);

const sanitizeUser = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  isActive: user.isActive,
  mustChangePassword: user.mustChangePassword,
  role: user.role
    ? {
        id: user.role.id,
        name: user.role.name,
      }
    : null,
  department: user.department
    ? {
        id: user.department.id,
        name: user.department.name,
      }
    : null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getRoleByName = async (name: Roles) => {
  const existingRole = await roleRepo.findOne({
    where: { name },
  });

  if (existingRole) {
    return existingRole;
  }

  return roleRepo.save(
    roleRepo.create({
      name,
    })
  );
};

export class AuthService {
  async register(data: {
    username: string;
    email: string;
    password: string;
    roleName?: Roles;
  }) {
    const username = data.username.trim();
    const email = data.email.trim().toLowerCase();

    const existing = await userRepo.findOne({
      where: [{ username }, { email }],
    });

    if (existing) {
      throw new Error("User already exists");
    }

    const role = await getRoleByName(data.roleName ?? Roles.Employee);
    const password = await bcrypt.hash(data.password, 10);

    const user = await userRepo.save(
      userRepo.create({
        username,
        email,
        password,
        mustChangePassword: false,
        isActive: true,
        role,
        roleId: role.id,
      })
    );

    const fullUser = await userRepo.findOneOrFail({
      where: { id: user.id },
      relations: ["role", "department"],
    });

    return {
      token: signAuthToken(fullUser),
      user: sanitizeUser(fullUser),
      message: "Registration successful",
    };
  }

  async signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepo.findOne({
      where: { email: normalizedEmail },
      relations: ["role", "department"],
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("User account is inactive");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    return {
      token: signAuthToken(user),
      user: sanitizeUser(user),
      message: "Login successful",
    };
  }

  async resetPasswordDirect(email: string, newPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepo.findOne({
      where: { email: normalizedEmail },
      relations: ["role", "department"],
    });

    if (!user) {
      throw new Error("User not found");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await userRepo.save(user);

    return { message: "Password reset successful" };
  }

  async syncUser(identity: { id?: string; email?: string }) {
    if (!identity.id && !identity.email) {
      throw new Error("Unauthorized");
    }

    const user = await userRepo.findOne({
      where: [
        identity.id ? { id: identity.id } : undefined,
        identity.email ? { email: identity.email.toLowerCase() } : undefined,
      ].filter(Boolean) as Array<{ id?: string; email?: string }>,
      relations: ["role", "department"],
    });

    if (!user) {
      throw new Error("User not found");
    }

    return sanitizeUser(user);
  }

  async provisionLocalUser(data: {
    username: string;
    email: string;
    password?: string;
    roleName?: Roles;
  }) {
    const requestedRole = data.roleName ?? Roles.Employee;
    const role = await getRoleByName(requestedRole);
    const temporaryPassword =
      data.password?.trim() ||
      `HRMA${Math.random().toString(36).slice(2, 6)}${Date.now()
        .toString()
        .slice(-4)}`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const user = await userRepo.save(
      userRepo.create({
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        mustChangePassword: !data.password,
        isActive: true,
        role,
      })
    );

    const fullUser = await userRepo.findOneOrFail({
      where: { id: user.id },
      relations: ["role", "department"],
    });

    return {
      user: fullUser,
      temporaryPassword: data.password ? null : temporaryPassword,
    };
  }
}
