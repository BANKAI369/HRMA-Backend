import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/Department";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { JobTitle } from "../entities/JobTitle";
import { User } from "../entities/User";
import { Role } from "../entities/role";
import { Roles } from "../utils/roles.enum";

const userRepo = AppDataSource.getRepository(User);
const roleRepo = AppDataSource.getRepository(Role);
const departmentRepo = AppDataSource.getRepository(Department);
const profileRepo = AppDataSource.getRepository(EmployeeProfile);
const jobTitleRepo = AppDataSource.getRepository(JobTitle);

type NullableId = string | null | undefined;

type CreateUserInput = {
  username: string;
  email: string;
  cognitoUsername?: string | null;
  cognitoSub?: string | null;
  roleName?: Roles;
  departmentId?: string | null;
  jobTitleId?: string | null;
  isActive?: boolean;
};

type UpdateUserInput = Partial<User> & {
  password?: string;
  jobTitleId?: string | null;
};

const normalizeOptionalId = (value: NullableId) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const resolveRoleEntity = async (roleName: Roles) => {
  const roleEntity = await roleRepo.findOne({
    where: { name: roleName },
  });

  if (!roleEntity) {
    throw new Error(
      roleName === Roles.Employee
        ? "Default role not found. Seed roles first."
        : "Role not found. Seed roles first."
    );
  }

  return roleEntity;
};

const resolveDepartment = async (departmentId: NullableId) => {
  const normalizedDepartmentId = normalizeOptionalId(departmentId);

  if (normalizedDepartmentId === undefined) {
    return undefined;
  }

  if (normalizedDepartmentId === null) {
    return null;
  }

  const department = await departmentRepo.findOne({
    where: { id: normalizedDepartmentId },
  });

  if (!department) {
    throw new Error("Department not found");
  }

  return department;
};

const resolveJobTitle = async (jobTitleId: NullableId) => {
  const normalizedJobTitleId = normalizeOptionalId(jobTitleId);

  if (normalizedJobTitleId === undefined) {
    return undefined;
  }

  if (normalizedJobTitleId === null) {
    return null;
  }

  const jobTitle = await jobTitleRepo.findOne({
    where: { id: normalizedJobTitleId },
  });

  if (!jobTitle) {
    throw new Error("Job title not found");
  }

  return jobTitle;
};

export class UserService {
  async create(data: CreateUserInput) {
    const normalizedUsername = data.username.trim();
    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = await userRepo.findOne({
      where: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existing) {
      throw new Error("User already exists");
    }

    const requestedRole = data.roleName ?? Roles.Employee;
    const roleEntity = await resolveRoleEntity(requestedRole);
    const department = await resolveDepartment(data.departmentId);
    const jobTitle = await resolveJobTitle(data.jobTitleId);

    const createdUserId = await AppDataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        username: normalizedUsername,
        email: normalizedEmail,
        cognitoUsername: data.cognitoUsername?.trim() || null,
        cognitoSub: data.cognitoSub?.trim() || null,
        isActive: data.isActive ?? true,
        role: roleEntity,
        roleId: roleEntity.id,
        department: department ?? null,
        departmentId: department?.id ?? null,
      });

      const savedUser = await manager.save(User, user);

      const profile = manager.create(EmployeeProfile, {
        user: savedUser,
        userId: savedUser.id,
        jobTitle: jobTitle ?? null,
        jobTitleId: jobTitle?.id ?? null,
      });

      await manager.save(EmployeeProfile, profile);

      return savedUser.id;
    });

    return this.findOne(createdUserId);
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

    const { password: _password, jobTitleId, ...persistedData } = data;
    const jobTitle = await resolveJobTitle(jobTitleId);

    userRepo.merge(user, persistedData);

    await AppDataSource.transaction(async (manager) => {
      await manager.save(User, user);

      if (jobTitleId !== undefined) {
        let profile = await manager.findOne(EmployeeProfile, {
          where: { userId: user.id },
        });

        if (!profile) {
          profile = manager.create(EmployeeProfile, {
            user,
            userId: user.id,
          });
        }

        profile.jobTitle = jobTitle ?? null;
        profile.jobTitleId = jobTitle?.id ?? null;

        await manager.save(EmployeeProfile, profile);
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    user.isActive = false;
    user.role = null;
    user.roleId = null;
    user.department = null;
    user.departmentId = null;
    await userRepo.save(user);
    return { message: "User deleted successfully" };
  }
}
