import { Response } from "express";
import { In } from "typeorm";
import { z } from "zod";
import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/Department";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { JobTitle } from "../entities/JobTitle";
import { User } from "../entities/User";
import { Role } from "../entities/role";
import { AuthRequest } from "../middleware/auth.middleware";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { resolveAuthenticatedUser } from "../utils/auth-user.utils";
import { Roles } from "../utils/roles.enum";
import { normalizeRole, resolveRequestRole } from "../utils/role.utils";

const service = new UserService();
const authService = new AuthService();

const nullableIdField = z
  .union([z.string().trim().min(1), z.literal(""), z.null()])
  .optional();

const createUserSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  role: z.nativeEnum(Roles).optional(),
  password: z.string().trim().min(6).optional(),
});

const updateUserSchema = z.object({
  username: z.string().trim().min(1).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  role: z.string().trim().min(1).optional(),
  password: z.string().trim().min(6).optional(),
  isActive: z.boolean().optional(),
  departmentId: nullableIdField,
  jobTitleId: nullableIdField,
});

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

const serializeRole = (role: Role | null) =>
  role ? { id: role.id, name: role.name } : null;

const serializeDepartment = (department: Department | null) =>
  department ? { id: department.id, name: department.name } : null;

const serializeJobTitle = (jobTitle: JobTitle | null) =>
  jobTitle ? { id: jobTitle.id, name: jobTitle.name } : null;

const serializeUserManagementResponse = (
  user: User,
  profile: EmployeeProfile | null
) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  isActive: user.isActive,
  mustChangePassword: user.mustChangePassword,
  role: serializeRole(user.role ?? null),
  department: serializeDepartment(user.department ?? null),
  jobTitle: serializeJobTitle(profile?.jobTitle ?? null),
  createdAt: user.createdAt?.toISOString?.(),
  updatedAt: user.updatedAt?.toISOString?.(),
});

const loadProfilesByUserIds = async (userIds: string[]) => {
  if (!userIds.length) {
    return new Map<string, EmployeeProfile>();
  }

  const profileRepo = AppDataSource.getRepository(EmployeeProfile);
  const profiles = await profileRepo.find({
    where: { userId: In(userIds) },
    relations: ["jobTitle"],
  });

  return new Map(profiles.map((profile) => [profile.userId, profile]));
};

const loadSerializedUserById = async (userId: string) => {
  const userRepo = AppDataSource.getRepository(User);
  const profileRepo = AppDataSource.getRepository(EmployeeProfile);

  const user = await userRepo.findOne({
    where: { id: userId },
    relations: ["role", "department"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  const profile = await profileRepo.findOne({
    where: { userId },
    relations: ["jobTitle"],
  });

  return serializeUserManagementResponse(user, profile);
};

const ensureProfile = async (userId: string) => {
  const profileRepo = AppDataSource.getRepository(EmployeeProfile);
  const existingProfile = await profileRepo.findOne({
    where: { userId },
    relations: ["jobTitle"],
  });

  if (existingProfile) {
    return existingProfile;
  }

  return profileRepo.save(profileRepo.create({ userId }));
};

const buildUserSearchText = (
  user: ReturnType<typeof serializeUserManagementResponse>
) =>
  [
    user.username,
    user.email,
    user.role?.name,
    user.department?.name,
    user.jobTitle?.name,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

const isSoftDeletedUser = (
  user:
    | User
    | {
        isActive?: boolean;
        role?: Role | { name?: string } | null;
      }
) => !user.isActive && !user.role;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export async function createUser(req: AuthRequest, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const requesterRole = resolveRequestRole(req);
    const selectedRole = parsed.data.role ?? Roles.Employee;

    if (requesterRole === Roles.Manager && selectedRole !== Roles.Employee) {
      return res.status(403).json({
        message: "Managers can only create employees",
      });
    }

    const created = await authService.provisionLocalUser({
      username: parsed.data.username,
      email: parsed.data.email,
      password: parsed.data.password,
      roleName: selectedRole,
    });

    const createdUser = await loadSerializedUserById(created.user.id);

    return res.status(201).json({
      ...createdUser,
      temporaryPassword: created.temporaryPassword,
      message: created.temporaryPassword
        ? `User created successfully. Temporary password: ${created.temporaryPassword}`
        : "User created successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      message: getErrorMessage(error, "Failed to create user"),
    });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(200).json(await service.remove(parsed.data.id));
  } catch (error) {
    return res.status(400).json({
      message: getErrorMessage(error, "Failed to delete user"),
    });
  }
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const requesterId = req.user?.id ?? null;
    const requesterEmail = req.user?.email ?? null;
    const rawSearch =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const search = rawSearch.toLowerCase();

    const userRepo = AppDataSource.getRepository(User);
    const users = (
      await userRepo.find({
        relations: ["role", "department"],
      })
    ).filter((user) => !isSoftDeletedUser(user));

    const profilesByUserId = await loadProfilesByUserIds(
      users.map((user) => user.id)
    );

    const serializedUsers = users
      .map((user) =>
        serializeUserManagementResponse(
          user,
          profilesByUserId.get(user.id) ?? null
        )
      )
      .filter((user) => {
        if (requesterEmail && user.email === requesterEmail) {
          return false;
        }

        if (!requesterEmail && requesterId && user.id === requesterId) {
          return false;
        }

        if (!search) {
          return true;
        }

        return buildUserSearchText(user).includes(search);
      })
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });

    return res.json(serializedUsers);
  } catch (error) {
    return res.status(500).json({
      message: getErrorMessage(error, "Failed to fetch users"),
    });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const currentUser = await resolveAuthenticatedUser(req, ["role", "department"]);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileRepo = AppDataSource.getRepository(EmployeeProfile);
    const profile = await profileRepo.findOne({
      where: { userId: currentUser.id },
      relations: ["jobTitle"],
    });

    return res.json(serializeUserManagementResponse(currentUser, profile));
  } catch (error) {
    return res.status(500).json({
      message: getErrorMessage(error, "Failed to fetch user"),
    });
  }
}

export const getUsersByDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const currentUser = await resolveAuthenticatedUser(req, ["role", "department"]);
    const requesterId = req.user?.id ?? null;
    const requesterEmail = req.user?.email || null;

    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentUser.department?.id) {
      return res
        .status(400)
        .json({ message: "User is not assigned to any department" });
    }

    const rawSearch =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const search = rawSearch.toLowerCase();

    const users = (
      await userRepo.find({
        where: { departmentId: currentUser.department.id },
        relations: ["department", "role"],
      })
    ).filter((user) => {
      if (requesterEmail && user.email === requesterEmail) {
        return false;
      }

      if (!requesterEmail && requesterId && user.id === requesterId) {
        return false;
      }

      if (search) {
        return `${user.username} ${user.email}`.toLowerCase().includes(search);
      }

      return true;
    });

    const profilesByUserId = await loadProfilesByUserIds(
      users.map((user) => user.id)
    );

    return res.json(
      users.map((user) =>
        serializeUserManagementResponse(
          user,
          profilesByUserId.get(user.id) ?? null
        )
      )
    );
  } catch {
    return res.status(500).json({
      message: "Failed to fetch department users",
    });
  }
};

export async function getUser(req: AuthRequest, res: Response) {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const role = resolveRequestRole(req);
    const isAdmin = role.toLowerCase() === Roles.Admin.toLowerCase();
    const user = await service.findOne(parsed.data.id);
    const requesterEmail = req.user?.email || null;
    const isSelf =
      (requesterEmail && user.email === requesterEmail) ||
      req.user?.id === parsed.data.id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const profileRepo = AppDataSource.getRepository(EmployeeProfile);
    const profile = await profileRepo.findOne({
      where: { userId: user.id },
      relations: ["jobTitle"],
    });

    return res.json(serializeUserManagementResponse(user, profile));
  } catch (error) {
    return res.status(404).json({
      message: getErrorMessage(error, "User not found"),
    });
  }
}

export const updateUser = async (req: AuthRequest, res: Response) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: paramsParsed.error.flatten().fieldErrors,
    });
  }

  const bodyParsed = updateUserSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: bodyParsed.error.flatten().fieldErrors,
    });
  }

  try {
    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    const departmentRepo = AppDataSource.getRepository(Department);
    const jobTitleRepo = AppDataSource.getRepository(JobTitle);
    const { username, email, role, isActive, departmentId, jobTitleId, password } =
      bodyParsed.data;

    const user = await userRepo.findOne({
      where: { id: paramsParsed.data.id },
      relations: ["role", "department"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requesterRole = resolveRequestRole(req).toLowerCase();
    const isAdminRequester = requesterRole === Roles.Admin.toLowerCase();
    const isManagerRequester = requesterRole === Roles.Manager.toLowerCase();

    if (!isAdminRequester && !isManagerRequester) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (isManagerRequester) {
      const currentUser = await resolveAuthenticatedUser(req, ["department"]);
      const requestedFields = Object.entries(bodyParsed.data).filter(
        ([, value]) => value !== undefined
      );
      const isStatusOnlyRequest =
        requestedFields.length === 1 && typeof isActive === "boolean";

      if (
        !currentUser?.department?.id ||
        user.departmentId !== currentUser.department.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!isStatusOnlyRequest) {
        return res.status(403).json({
          message: "Managers can only update status for users in their department",
        });
      }
    }

    if (typeof username === "string") {
      const normalizedUsername = username.trim();
      const existingUsernameUser = await userRepo.findOne({
        where: { username: normalizedUsername },
      });

      if (existingUsernameUser && existingUsernameUser.id !== user.id) {
        return res.status(400).json({ message: "Username already exists" });
      }

      user.username = normalizedUsername;
    }

    if (typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      const existingEmailUser = await userRepo.findOne({
        where: { email: normalizedEmail },
      });

      if (existingEmailUser && existingEmailUser.id !== user.id) {
        return res.status(400).json({ message: "Email already exists" });
      }

      user.email = normalizedEmail;
    }

    if (typeof role === "string" && role.trim()) {
      const normalizedRole = normalizeRole(role);
      if (!normalizedRole) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const roleEntity = await roleRepo.findOne({
        where: { name: normalizedRole },
      });

      if (!roleEntity) {
        return res.status(404).json({ message: "Role not found" });
      }

      user.role = roleEntity;
      user.roleId = roleEntity.id;
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === "") {
        user.department = null;
        user.departmentId = null;
      } else {
        const department = await departmentRepo.findOne({
          where: { id: departmentId },
        });

        if (!department) {
          return res.status(404).json({ message: "Department not found" });
        }

        user.department = department;
        user.departmentId = department.id;
      }
    }

    await userRepo.save(user);

    if (jobTitleId !== undefined) {
      const profile = await ensureProfile(user.id);

      if (jobTitleId === null || jobTitleId === "") {
        profile.jobTitle = null;
        profile.jobTitleId = null;
      } else {
        const jobTitle = await jobTitleRepo.findOne({
          where: { id: jobTitleId },
        });

        if (!jobTitle) {
          return res.status(404).json({ message: "Job title not found" });
        }

        profile.jobTitle = jobTitle;
        profile.jobTitleId = jobTitle.id;
      }

      await AppDataSource.getRepository(EmployeeProfile).save(profile);
    }

    if (typeof password === "string" && password.trim()) {
      await service.update(user.id, { password });
    }

    return res.json(await loadSerializedUserById(user.id));
  } catch (error) {
    return res.status(500).json({
      message: getErrorMessage(error, "Update failed"),
    });
  }
};
