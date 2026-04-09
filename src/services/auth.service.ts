import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/role";
import { Roles } from "../utils/roles.enum";

const userRepo = AppDataSource.getRepository(User);
const roleRepo = AppDataSource.getRepository(Role);

const JWT_SECRET: Secret = process.env.JWT_SECRET || "hrma-local-secret";
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

const buildTemporaryPassword = () =>
  `HRMA${Math.random().toString(36).slice(2, 6)}${Date.now().toString().slice(-4)}`;

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

const signToken = (user: User) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role?.name || Roles.Employee,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );

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
  async register(username: string, email: string, password: string) {
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !password?.trim()) {
      throw new Error("Username, email, and password are required");
    }

    const existingUser = await userRepo.findOne({
      where: [{ email: normalizedEmail }, { username: normalizedUsername }],
      relations: ["role", "department"],
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const employeeRole = await getRoleByName(Roles.Employee);
    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await userRepo.save(
      userRepo.create({
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        mustChangePassword: false,
        isActive: true,
        role: employeeRole,
      })
    );

    const user = await userRepo.findOneOrFail({
      where: { id: createdUser.id },
      relations: ["role", "department"],
    });

    return {
      token: signToken(user),
      user: sanitizeUser(user),
      message: "Account created successfully",
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
      throw new Error("Your account is inactive");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    return {
      token: signToken(user),
      user: sanitizeUser(user),
      message: user.mustChangePassword
        ? "Login successful. Please reset your password."
        : "Login successful",
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
    user.resetToken = null;

    const updatedUser = await userRepo.save(user);

    return {
      message: "Password updated successfully",
      user: sanitizeUser(updatedUser),
    };
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
    roleName?: Roles;
    password?: string;
  }) {
    const requestedRole = data.roleName ?? Roles.Employee;
    const role = await getRoleByName(requestedRole);
    const temporaryPassword = data.password?.trim() || buildTemporaryPassword();
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
