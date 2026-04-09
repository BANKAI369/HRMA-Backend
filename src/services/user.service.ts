import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/role";
import { Roles } from "../utils/roles.enum";

const userRepo = AppDataSource.getRepository(User);
const roleRepo = AppDataSource.getRepository(Role);

type CreateUserInput = Partial<User> & {
  password?: string;
  roleName?: Roles;
};

type UpdateUserInput = Partial<User> & {
  password?: string;
};

const buildTemporaryPassword = () =>
  `HRMA${Math.random().toString(36).slice(2, 6)}${Date.now().toString().slice(-4)}`;

export class UserService {
  async create(data: CreateUserInput) {
    const normalizedUsername = data.username?.trim();
    const normalizedEmail = data.email?.trim().toLowerCase();

    const existing = await userRepo.findOne({
      where: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existing) {
      throw new Error("User already exists");
    }

    const requestedRole = data.roleName ?? Roles.Employee;

    let roleEntity = await roleRepo.findOne({
      where: { name: requestedRole },
    });

    if (!roleEntity) {
      roleEntity = await roleRepo.save(
        roleRepo.create({
          name: requestedRole,
        })
      );
    }

    const temporaryPassword = data.password?.trim() || buildTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const { password: _password, roleName: _roleName, ...persistedData } = data;
    const user = userRepo.create({
      ...persistedData,
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      mustChangePassword: !data.password,
      role: roleEntity,
    });

    return {
      user: await userRepo.save(user),
      temporaryPassword: data.password ? null : temporaryPassword,
    };
  }

  async findAll() {
    return userRepo.find({
      relations: ["role", "department"],
    });
  }

  async findOne(id: string) {
    const user = await userRepo.findOne({
      where: { id },
      relations: ["role", "department"],
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async update(id: string, data: UpdateUserInput) {
    const user = await this.findOne(id);

    const { password, ...persistedData } = data;
    userRepo.merge(user, persistedData);
    if (typeof password === "string" && password.trim()) {
      user.password = await bcrypt.hash(password, 10);
      user.mustChangePassword = false;
    }
    return userRepo.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    user.isActive = false;
    user.role = null;
    user.department = null;
    await userRepo.save(user);
    return { message: "User deleted successfully" };
  }
}
