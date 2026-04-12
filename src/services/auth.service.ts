import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/role";
import { Roles } from "../utils/roles.enum";

const userRepo = AppDataSource.getRepository(User);
const roleRepo = AppDataSource.getRepository(Role);

<<<<<<< Updated upstream
=======
const JWT_SECRET: Secret = process.env.JWT_SECRET || "hrma-local-secret";
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

const buildTemporaryPassword = () =>
  `NEST${Math.random().toString(36).slice(2, 6)}${Date.now().toString().slice(-4)}`;

>>>>>>> Stashed changes
const sanitizeUser = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  isActive: user.isActive,
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
  async register() {
    throw new Error("Local auth is disabled. Use Cognito signup instead.");
  }

  async signIn() {
    throw new Error("Local auth is disabled. Use Cognito sign-in instead.");
  }

  async resetPasswordDirect() {
    throw new Error(
      "Direct password reset is disabled. Reset credentials in Cognito."
    );
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
  }) {
    const requestedRole = data.roleName ?? Roles.Employee;
    const role = await getRoleByName(requestedRole);

    const user = await userRepo.save(
      userRepo.create({
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
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
      temporaryPassword: null,
    };
  }
}
