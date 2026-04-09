import bcrypt from "bcryptjs";
import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/Department";
import { EmployeeGroup } from "../entities/EmployeeGroup";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { JobTitle } from "../entities/JobTitle";
import { Location } from "../entities/Location";
import { NoticePeriod } from "../entities/NoticePeriod";
import { Role } from "../entities/role";
import { User } from "../entities/User";
import { Roles } from "../utils/roles.enum";
import { normalizeRole } from "../utils/role.utils";

const userRepository = AppDataSource.getRepository(User);
const profileRepository = AppDataSource.getRepository(EmployeeProfile);
const roleRepository = AppDataSource.getRepository(Role);
const departmentRepository = AppDataSource.getRepository(Department);
const locationRepository = AppDataSource.getRepository(Location);
const jobTitleRepository = AppDataSource.getRepository(JobTitle);
const noticePeriodRepository = AppDataSource.getRepository(NoticePeriod);
const groupRepository = AppDataSource.getRepository(EmployeeGroup);

type NullableInput = string | null | undefined;

export type CreateEmployeeInput = {
  username: string;
  email: string;
  password?: string;
  roleName?: Roles;
  departmentId?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  employeeCode?: string;
  dateOfJoining?: string;
  locationId?: string | null;
  jobTitleId?: string | null;
  managerUserId?: string | null;
  noticePeriodId?: string | null;
  groupId?: string | null;
};

export type UpdateEmployeePersonalDetailsInput = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
};

export type UpdateEmployeeJobDetailsInput = {
  employeeCode?: string | null;
  dateOfJoining?: string | null;
  locationId?: string | null;
  jobTitleId?: string | null;
  managerUserId?: string | null;
  noticePeriodId?: string | null;
  groupId?: string | null;
  departmentId?: string | null;
  role?: string | null;
  isActive?: boolean;
};

const buildTemporaryPassword = () =>
  `NEST${Math.random().toString(36).slice(2, 6)}${Date.now()
    .toString()
    .slice(-4)}`;

const normalizeOptionalValue = (value: NullableInput) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const serializeRole = (role: Role | null) =>
  role
    ? {
        id: role.id,
        name: role.name,
      }
    : null;

const serializeDepartment = (department: Department | null) =>
  department
    ? {
        id: department.id,
        name: department.name,
      }
    : null;

const serializeManager = (manager: User | null) =>
  manager
    ? {
        id: manager.id,
        username: manager.username,
        email: manager.email,
      }
    : null;

const isSoftDeletedUser = (user: User) => !user.isActive && !user.role;

export class EmployeeService {
  private buildEmployeeResponse(user: User, profile: EmployeeProfile | null) {
    const firstName = profile?.firstName ?? null;
    const lastName = profile?.lastName ?? null;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      role: serializeRole(user.role ?? null),
      department: serializeDepartment(user.department ?? null),
      personalDetails: {
        firstName,
        lastName,
        fullName: fullName || user.username,
        phone: profile?.phone ?? null,
        dateOfBirth: profile?.dateOfBirth ?? null,
        gender: profile?.gender ?? null,
      },
      jobDetails: {
        employeeCode: profile?.employeeCode ?? null,
        dateOfJoining: profile?.dateOfJoining ?? null,
        location: profile?.location
          ? {
              id: profile.location.id,
              name: profile.location.name,
              countryCode: profile.location.countryCode,
            }
          : null,
        jobTitle: profile?.jobTitle
          ? {
              id: profile.jobTitle.id,
              name: profile.jobTitle.name,
            }
          : null,
        manager: serializeManager(profile?.manager ?? null),
        noticePeriod: profile?.noticePeriod
          ? {
              id: profile.noticePeriod.id,
              name: profile.noticePeriod.name,
              days: profile.noticePeriod.days,
            }
          : null,
        group: profile?.group
          ? {
              id: profile.group.id,
              name: profile.group.name,
              groupTypeId: profile.group.groupTypeId,
            }
          : null,
      },
      createdAt: user.createdAt?.toISOString?.(),
      updatedAt: user.updatedAt?.toISOString?.(),
    };
  }

  private async loadProfile(userId: string) {
    return profileRepository.findOne({
      where: { userId },
      relations: ["location", "jobTitle", "noticePeriod", "group", "manager"],
    });
  }

  private async loadUser(userId: string) {
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ["role", "department"],
    });

    if (!user || isSoftDeletedUser(user)) {
      throw new Error("Employee not found");
    }

    return user;
  }

  private async ensureProfile(userId: string) {
    const existingProfile = await this.loadProfile(userId);
    if (existingProfile) {
      return existingProfile;
    }

    const profile = profileRepository.create({
      userId,
    });

    return profileRepository.save(profile);
  }

  private async ensureEmployeeCodeAvailable(
    employeeCode: string | null,
    currentUserId?: string
  ) {
    if (!employeeCode) {
      return;
    }

    const existing = await profileRepository.findOne({
      where: { employeeCode },
    });

    if (existing && existing.userId !== currentUserId) {
      throw new Error("Employee code already exists");
    }
  }

  private async resolveDepartment(departmentId: NullableInput) {
    const normalizedDepartmentId = normalizeOptionalValue(departmentId);
    if (normalizedDepartmentId === undefined) {
      return undefined;
    }

    if (normalizedDepartmentId === null) {
      return null;
    }

    const department = await departmentRepository.findOne({
      where: { id: normalizedDepartmentId },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    return department;
  }

  private async resolveRole(roleValue: string | null | undefined) {
    if (roleValue === undefined) {
      return undefined;
    }

    if (roleValue === null) {
      return null;
    }

    const normalizedRole = normalizeRole(roleValue);
    if (!normalizedRole) {
      throw new Error("Invalid role");
    }

    let roleEntity = await roleRepository.findOne({
      where: { name: normalizedRole },
    });

    if (!roleEntity) {
      roleEntity = await roleRepository.save(
        roleRepository.create({
          name: normalizedRole,
        })
      );
    }

    return roleEntity;
  }

  private async resolveLocation(locationId: NullableInput) {
    const normalizedLocationId = normalizeOptionalValue(locationId);
    if (normalizedLocationId === undefined) {
      return undefined;
    }

    if (normalizedLocationId === null) {
      return null;
    }

    const location = await locationRepository.findOne({
      where: { id: normalizedLocationId },
    });

    if (!location) {
      throw new Error("Location not found");
    }

    return location;
  }

  private async resolveJobTitle(jobTitleId: NullableInput) {
    const normalizedJobTitleId = normalizeOptionalValue(jobTitleId);
    if (normalizedJobTitleId === undefined) {
      return undefined;
    }

    if (normalizedJobTitleId === null) {
      return null;
    }

    const jobTitle = await jobTitleRepository.findOne({
      where: { id: normalizedJobTitleId },
    });

    if (!jobTitle) {
      throw new Error("Job title not found");
    }

    return jobTitle;
  }

  private async resolveNoticePeriod(noticePeriodId: NullableInput) {
    const normalizedNoticePeriodId = normalizeOptionalValue(noticePeriodId);
    if (normalizedNoticePeriodId === undefined) {
      return undefined;
    }

    if (normalizedNoticePeriodId === null) {
      return null;
    }

    const noticePeriod = await noticePeriodRepository.findOne({
      where: { id: normalizedNoticePeriodId },
    });

    if (!noticePeriod) {
      throw new Error("Notice period not found");
    }

    return noticePeriod;
  }

  private async resolveGroup(groupId: NullableInput) {
    const normalizedGroupId = normalizeOptionalValue(groupId);
    if (normalizedGroupId === undefined) {
      return undefined;
    }

    if (normalizedGroupId === null) {
      return null;
    }

    const group = await groupRepository.findOne({
      where: { id: normalizedGroupId },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    return group;
  }

  private async resolveManager(
    managerUserId: NullableInput,
    employeeUserId?: string
  ) {
    const normalizedManagerUserId = normalizeOptionalValue(managerUserId);
    if (normalizedManagerUserId === undefined) {
      return undefined;
    }

    if (normalizedManagerUserId === null) {
      return null;
    }

    if (employeeUserId && normalizedManagerUserId === employeeUserId) {
      throw new Error("Employee cannot report to themselves");
    }

    const manager = await userRepository.findOne({
      where: { id: normalizedManagerUserId },
      relations: ["role"],
    });

    if (!manager || isSoftDeletedUser(manager)) {
      throw new Error("Manager not found");
    }

    return manager;
  }

  async findAll(search?: string) {
    const users = (
      await userRepository.find({
        relations: ["role", "department"],
      })
    ).filter((user) => !isSoftDeletedUser(user));

    const profiles = users.length
      ? await profileRepository.find({
          where: {
            userId: In(users.map((user) => user.id)),
          },
          relations: ["location", "jobTitle", "noticePeriod", "group", "manager"],
        })
      : [];

    const profilesByUserId = new Map(
      profiles.map((profile) => [profile.userId, profile])
    );

    const normalizedSearch = search?.trim().toLowerCase() || "";

    return users
      .map((user) =>
        this.buildEmployeeResponse(user, profilesByUserId.get(user.id) ?? null)
      )
      .filter((employee) => {
        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          employee.username,
          employee.email,
          employee.role?.name,
          employee.department?.name,
          employee.personalDetails.firstName,
          employee.personalDetails.lastName,
          employee.personalDetails.fullName,
          employee.jobDetails.employeeCode,
          employee.jobDetails.jobTitle?.name,
          employee.jobDetails.location?.name,
        ]
          .filter((value): value is string => Boolean(value))
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }

  async findOne(userId: string) {
    const user = await this.loadUser(userId);
    const profile = await this.loadProfile(userId);
    return this.buildEmployeeResponse(user, profile);
  }

  async create(data: CreateEmployeeInput) {
    const normalizedUsername = data.username.trim();
    const normalizedEmail = data.email.trim().toLowerCase();
    const requestedRole = data.roleName ?? Roles.Employee;

    const existingUser = await userRepository.findOne({
      where: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    const temporaryPassword = data.password?.trim() || buildTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const department = await this.resolveDepartment(data.departmentId);
    const location = await this.resolveLocation(data.locationId);
    const jobTitle = await this.resolveJobTitle(data.jobTitleId);
    const noticePeriod = await this.resolveNoticePeriod(data.noticePeriodId);
    const group = await this.resolveGroup(data.groupId);
    const manager = await this.resolveManager(data.managerUserId);
    const role = await this.resolveRole(requestedRole);
    const employeeCode = normalizeOptionalValue(data.employeeCode) ?? null;

    await this.ensureEmployeeCodeAvailable(employeeCode);

    if (!role) {
      throw new Error("Role not found");
    }

    const createdUserId = await AppDataSource.transaction(async (managerTx) => {
      const user = managerTx.create(User, {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        mustChangePassword: !data.password,
        isActive: true,
        role,
        roleId: role.id,
        department: department ?? null,
        departmentId: department?.id ?? null,
      });

      const savedUser = await managerTx.save(User, user);

      const profile = managerTx.create(EmployeeProfile, {
        user: savedUser,
        userId: savedUser.id,
        firstName: normalizeOptionalValue(data.firstName) ?? null,
        lastName: normalizeOptionalValue(data.lastName) ?? null,
        phone: normalizeOptionalValue(data.phone) ?? null,
        dateOfBirth: normalizeOptionalValue(data.dateOfBirth) ?? null,
        gender: normalizeOptionalValue(data.gender) ?? null,
        employeeCode,
        dateOfJoining: normalizeOptionalValue(data.dateOfJoining) ?? null,
        location: location ?? null,
        locationId: location?.id ?? null,
        jobTitle: jobTitle ?? null,
        jobTitleId: jobTitle?.id ?? null,
        noticePeriod: noticePeriod ?? null,
        noticePeriodId: noticePeriod?.id ?? null,
        group: group ?? null,
        groupId: group?.id ?? null,
        manager: manager ?? null,
        managerUserId: manager?.id ?? null,
      });

      await managerTx.save(EmployeeProfile, profile);
      return savedUser.id;
    });

    return {
      employee: await this.findOne(createdUserId),
      temporaryPassword: data.password ? null : temporaryPassword,
    };
  }

  async updatePersonalDetails(
    userId: string,
    data: UpdateEmployeePersonalDetailsInput
  ) {
    await this.loadUser(userId);
    const profile = await this.ensureProfile(userId);

    if (data.firstName !== undefined) {
      profile.firstName = normalizeOptionalValue(data.firstName) ?? null;
    }

    if (data.lastName !== undefined) {
      profile.lastName = normalizeOptionalValue(data.lastName) ?? null;
    }

    if (data.phone !== undefined) {
      profile.phone = normalizeOptionalValue(data.phone) ?? null;
    }

    if (data.dateOfBirth !== undefined) {
      profile.dateOfBirth = normalizeOptionalValue(data.dateOfBirth) ?? null;
    }

    if (data.gender !== undefined) {
      profile.gender = normalizeOptionalValue(data.gender) ?? null;
    }

    await profileRepository.save(profile);
    return this.findOne(userId);
  }

  async updateJobDetails(userId: string, data: UpdateEmployeeJobDetailsInput) {
    const user = await this.loadUser(userId);
    const profile = await this.ensureProfile(userId);

    const department = await this.resolveDepartment(data.departmentId);
    const role = await this.resolveRole(data.role);
    const location = await this.resolveLocation(data.locationId);
    const jobTitle = await this.resolveJobTitle(data.jobTitleId);
    const noticePeriod = await this.resolveNoticePeriod(data.noticePeriodId);
    const group = await this.resolveGroup(data.groupId);
    const manager = await this.resolveManager(data.managerUserId, userId);

    if (data.employeeCode !== undefined) {
      const employeeCode = normalizeOptionalValue(data.employeeCode) ?? null;
      await this.ensureEmployeeCodeAvailable(employeeCode, userId);
      profile.employeeCode = employeeCode;
    }

    if (data.dateOfJoining !== undefined) {
      profile.dateOfJoining = normalizeOptionalValue(data.dateOfJoining) ?? null;
    }

    if (location !== undefined) {
      profile.location = location;
      profile.locationId = location?.id ?? null;
    }

    if (jobTitle !== undefined) {
      profile.jobTitle = jobTitle;
      profile.jobTitleId = jobTitle?.id ?? null;
    }

    if (noticePeriod !== undefined) {
      profile.noticePeriod = noticePeriod;
      profile.noticePeriodId = noticePeriod?.id ?? null;
    }

    if (group !== undefined) {
      profile.group = group;
      profile.groupId = group?.id ?? null;
    }

    if (manager !== undefined) {
      profile.manager = manager;
      profile.managerUserId = manager?.id ?? null;
    }

    if (department !== undefined) {
      user.department = department;
      user.departmentId = department?.id ?? null;
    }

    if (role !== undefined) {
      user.role = role;
      user.roleId = role?.id ?? null;
    }

    if (typeof data.isActive === "boolean") {
      user.isActive = data.isActive;
    }

    await AppDataSource.transaction(async (managerTx) => {
      await managerTx.save(User, user);
      await managerTx.save(EmployeeProfile, profile);
    });

    return this.findOne(userId);
  }
}
