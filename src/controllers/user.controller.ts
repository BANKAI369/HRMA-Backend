import { Request, Response } from "express";
import { In } from "typeorm";
import { z } from "zod";
import { UserService } from "../services/user.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppDataSource } from "../config/data-source";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { JobTitle } from "../entities/JobTitle";
import { User } from "../entities/User";
import { Role } from "../entities/role";
import { Department } from "../entities/Department";
import {
  createCognitoUser,
  deleteCognitoUser,
  getCognitoUserIdentity,
  setCognitoUserEnabled,
  updateCognitoUserProfile,
  setCognitoUserRole,
} from "../services/cognito.service";
import { Roles } from "../utils/roles.enum";
import { normalizeRole, resolveRequestRole } from "../utils/role.utils";

const service = new UserService();

const nullableIdField = z
  .union([z.string().trim().min(1), z.literal(""), z.null()])
  .optional();

const createUserSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  email: z.string().email("Invalid email format"),
  role: z.nativeEnum(Roles).optional(),
  departmentId: nullableIdField,
  jobTitleId: nullableIdField,
});

const updateUserSchema = z.object({
  username: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  departmentId: nullableIdField,
  jobTitleId: nullableIdField,
});

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

const COGNITO_ID_PREFIX = "cognito:";

const extractCognitoUsernameFromId = (id: string) => {
  if (!id.startsWith(COGNITO_ID_PREFIX)) {
    return null;
  }

  const cognitoUsername = id.slice(COGNITO_ID_PREFIX.length).trim();
  return cognitoUsername || null;
};

const buildUserLookupWhere = (id: string) => {
  const cognitoUsernameFromId = extractCognitoUsernameFromId(id);

  if (!cognitoUsernameFromId) {
    return {
      where: { id },
      cognitoUsernameFromId: null,
    };
  }

  return {
    where: [
      { cognitoUsername: cognitoUsernameFromId },
      { email: cognitoUsernameFromId },
      { cognitoSub: cognitoUsernameFromId },
    ],
    cognitoUsernameFromId,
  };
};

const findUserByIdOrCognitoIdentity = async (
  id: string,
  userRepo: ReturnType<typeof AppDataSource.getRepository<User>>
) => {
  const { where, cognitoUsernameFromId } = buildUserLookupWhere(id);

  const user = await userRepo.findOne({
    where,
    relations: ["role", "department"],
  });

  return {
    user,
    cognitoUsernameFromId,
  };
};

const isCognitoUserMissingError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "UserNotFoundException" ||
    error.message.toLowerCase().includes("usernotfoundexception")
  );
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
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

const serializeJobTitle = (jobTitle: JobTitle | null) =>
  jobTitle
    ? {
        id: jobTitle.id,
        name: jobTitle.name,
      }
    : null;

const serializeUserManagementResponse = (
  user: User,
  profile: EmployeeProfile | null
) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  isActive: user.isActive,
  cognitoUsername: user.cognitoUsername,
  cognitoSub: user.cognitoSub,
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
    where: {
      userId: In(userIds),
    },
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

  const profile = profileRepo.create({
    userId,
  });

  return profileRepo.save(profile);
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

const resolveCurrentUser = async (req: AuthRequest) => {
  const userRepo = AppDataSource.getRepository(User);
  const currentUserSub = req.user?.sub;
  const currentUserId = req.user?.id;
  const currentUserEmail = req.user?.email || null;

  if (!currentUserSub && !currentUserId && !currentUserEmail) {
    return null;
  }

  return userRepo.findOne({
    where: [
      currentUserSub ? { cognitoSub: currentUserSub } : undefined,
      currentUserEmail ? { email: currentUserEmail } : undefined,
      currentUserId ? { id: currentUserId } : undefined,
    ].filter(Boolean) as Array<{ cognitoSub?: string; id?: string; email?: string }>,
    relations: ["role", "department"],
  });
};

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { username, email, role, departmentId, jobTitleId } = parsed.data;
    const requesterRole = resolveRequestRole(req);
    const selectedRole = role ?? Roles.Employee;

    if (requesterRole === Roles.Manager && selectedRole !== Roles.Employee) {
      return res.status(403).json({
        message: "Managers can only create employees",
      });
    }

    await createCognitoUser(email, selectedRole, {
      formattedName: username,
      suppressMessage: false,
    });

    const cognitoUser = await getCognitoUserIdentity(email);

    let user: User;
    try {
      user = await service.create({
        username,
        email,
        cognitoUsername: cognitoUser.cognitoUsername,
        cognitoSub: cognitoUser.cognitoSub,
        roleName: selectedRole,
        departmentId,
        jobTitleId,
      });
    } catch (error) {
      await deleteCognitoUser(cognitoUser.cognitoUsername).catch(() => undefined);
      throw error;
    }

    const createdUser = await loadSerializedUserById(user.id);

    res.status(201).json({
      ...createdUser,
      message:
        "User created successfully. A temporary password has been sent to the user's email. They can sign in and set a new password.",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
}


export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { id } = parsed.data;
    const { where, cognitoUsernameFromId } = buildUserLookupWhere(id);

    const user = await userRepo.findOne({
      where,
    });

    if (!user && !cognitoUsernameFromId) {
      return res.status(404).json({ message: "User not found" });
    }

    const cognitoUsernameToDelete =
      user?.cognitoUsername || user?.email || cognitoUsernameFromId;

    if (cognitoUsernameToDelete) {
      try {
        await setCognitoUserEnabled(cognitoUsernameToDelete, false);
      } catch (error) {
        if (!isCognitoUserMissingError(error)) {
          throw error;
        }
      }
    }
    if (user) {
      await AppDataSource.transaction(async (transactionManager) => {
        user.isActive = false;
        user.role = null;
        user.roleId = null;
        user.department = null;
        user.departmentId = null;
        await transactionManager.save(User, user);
      });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    res.status(500).json({ message });
  }
};

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const role = resolveRequestRole(req);
    const isAdmin = role?.toLowerCase() === "admin";

    if (!isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

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

    res.json(serializedUsers);

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  try {
    const currentUser = await resolveCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileRepo = AppDataSource.getRepository(EmployeeProfile);
    const profile = await profileRepo.findOne({
      where: { userId: currentUser.id },
      relations: ["jobTitle"],
    });

    res.json(serializeUserManagementResponse(currentUser, profile));
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch user" });
  }
}

export const getUsersByDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const currentUser = await resolveCurrentUser(req);
    const requesterId = req.user?.id ?? null;
    const requesterEmail = req.user?.email || null;

    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentUser?.department?.id) {
      return res.status(400).json({ message: "User is not assigned to any department" });
    }

    const rawSearch =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const rawName =
      typeof req.query.name === "string" ? req.query.name.trim() : "";
    const rawEmail =
      typeof req.query.email === "string" ? req.query.email.trim() : "";

    const search = rawSearch.toLowerCase();
    const name = rawName.toLowerCase();
    const email = rawEmail.toLowerCase();

    const query = userRepo
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.department", "department")
      .leftJoinAndSelect("user.role", "role")
      .where("department.id = :departmentId", {
        departmentId: currentUser.department.id,
      });

    if (search) {
      query.andWhere(
        "(LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (name) {
      query.andWhere("LOWER(user.username) LIKE :name", {
        name: `%${name}%`,
      });
    }

    if (email) {
      query.andWhere("LOWER(user.email) LIKE :email", {
        email: `%${email}%`,
      });
    }

    const users = (await query.getMany()).filter((user) => {
      if (requesterEmail && user.email === requesterEmail) {
        return false;
      }

      if (!requesterEmail && requesterId && user.id === requesterId) {
        return false;
      }

      return true;
    });

    const profilesByUserId = await loadProfilesByUserIds(
      users.map((user) => user.id)
    );

    res.json(
      users.map((user) =>
        serializeUserManagementResponse(
          user,
          profilesByUserId.get(user.id) ?? null
        )
      )
    );
  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch department users",
    });
  }
};

export async function getUser(req: AuthRequest, res: Response) {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const requestedUserId = parsed.data.id;

    const role = resolveRequestRole(req);
    const isAdmin = role?.toLowerCase() === "admin";
    const user = await service.findOne(requestedUserId);

    const requesterSub = req.user?.sub;
    const requesterEmail = req.user?.email || null;
    const isSelf =
      (requesterSub && user.cognitoSub === requesterSub) ||
      (requesterEmail && user.email === requesterEmail) ||
      req.user?.id === requestedUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const profileRepo = AppDataSource.getRepository(EmployeeProfile);
    const profile = await profileRepo.findOne({
      where: { userId: user.id },
      relations: ["jobTitle"],
    });

    res.json(serializeUserManagementResponse(user, profile));

  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
}

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
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

    const userRepo = AppDataSource.getRepository(User);
    const roleRepo = AppDataSource.getRepository(Role);
    const departmentRepo = AppDataSource.getRepository(Department);
    const profileRepo = AppDataSource.getRepository(EmployeeProfile);
    const jobTitleRepo = AppDataSource.getRepository(JobTitle);

    const { username, email, role, isActive, departmentId, jobTitleId } =
      bodyParsed.data;
    const { user: existingUser, cognitoUsernameFromId } =
      await findUserByIdOrCognitoIdentity(paramsParsed.data.id, userRepo);

    let user = existingUser;

    if (!user && cognitoUsernameFromId) {
      const cognitoUser = await getCognitoUserIdentity(cognitoUsernameFromId);
      const nextUsername = username?.trim() || cognitoUser.email || cognitoUsernameFromId;

      user = await service.create({
        username: nextUsername,
        email: cognitoUser.email || cognitoUsernameFromId,
        cognitoUsername: cognitoUser.cognitoUsername,
        cognitoSub: cognitoUser.cognitoSub,
      });

      user = await userRepo.findOne({
        where: { id: user.id },
        relations: ["role", "department"],
      });
    }

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
      const currentUser = await resolveCurrentUser(req);
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
          message:
            "Managers can only update status for users in their department",
        });
      }
    }

    const previousUsername = user.username;
    const previousEmail = user.email;
    const previousIsActive = user.isActive;
    const previousRoleName = user.role?.name ?? null;
    let nextCognitoRole: Roles | null = null;
    let cognitoIdentifier = user.cognitoUsername?.trim() || null;
    const profile = await ensureProfile(user.id);

    if (!cognitoIdentifier && user.email) {
      try {
        const cognitoIdentity = await getCognitoUserIdentity(user.email);
        cognitoIdentifier = cognitoIdentity.cognitoUsername;
        user.cognitoUsername = cognitoIdentity.cognitoUsername;
        user.cognitoSub = cognitoIdentity.cognitoSub;
      } catch (error) {
        if (!isCognitoUserMissingError(error)) {
          throw error;
        }
      }
    }

    // update fields
    if (typeof username === "string") {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        return res.status(400).json({ message: "Username is required" });
      }

      const existingUsernameUser = await userRepo.findOne({
        where: { username: trimmedUsername },
      });

      if (existingUsernameUser && existingUsernameUser.id !== user.id) {
        return res.status(400).json({ message: "Username already exists" });
      }

      user.username = trimmedUsername;
    }
    if (typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ message: "Email is required" });
      }

      const existingEmailUser = await userRepo.findOne({
        where: { email: normalizedEmail },
      });

      if (existingEmailUser && existingEmailUser.id !== user.id) {
        return res.status(400).json({ message: "Email already exists" });
      }

      user.email = normalizedEmail;
    }
    if (typeof isActive === "boolean") user.isActive = isActive;

    // update role
    if (typeof role === "string" && role.trim()) {
      const normalizedRole = normalizeRole(role);
      if (!normalizedRole) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const roleEntity = await roleRepo
        .createQueryBuilder("role")
        .where("LOWER(role.name) = :normalizedRole", {
          normalizedRole: normalizedRole.toLowerCase(),
        })
        .getOne();

      if (roleEntity) {
        user.role = roleEntity;
        user.roleId = roleEntity.id;
        nextCognitoRole = normalizedRole;
      }
    }

    const isManagerAfterUpdate =
      user.role?.name?.toLowerCase() === "manager";

    let nextDepartmentId: string | null | undefined =
      user.department?.id ?? null;

    if (departmentId !== undefined) {
      if (departmentId === null || departmentId === "") {
        user.department = null as any;
        nextDepartmentId = null;
      } else {
        if (typeof departmentId !== "string" || !departmentId.trim()) {
          return res.status(400).json({ message: "Invalid departmentId" });
        }

        const department = await departmentRepo.findOne({
          where: { id: departmentId },
        });

        if (!department) {
          return res.status(404).json({ message: "Department not found" });
        }

        user.department = department;
        nextDepartmentId = department.id;
        user.departmentId = department.id;
      }
    }

    if (departmentId !== undefined && (departmentId === null || departmentId === "")) {
      user.departmentId = null;
    }

    if (jobTitleId !== undefined) {
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
    }

    if (isManagerAfterUpdate && nextDepartmentId) {
      const existingManager = await userRepo
        .createQueryBuilder("u")
        .leftJoin("u.role", "role")
        .where("LOWER(role.name) = :roleName", {
          roleName: Roles.Manager.toLowerCase(),
        })
        .andWhere("u.departmentId = :departmentId", {
          departmentId: nextDepartmentId,
        })
        .andWhere("u.id != :userId", { userId: user.id })
        .getOne();

      if (existingManager) {
        return res
          .status(400)
          .json({ message: "Department already has a manager" });
      }
    }

    const shouldSyncCognitoRole =
      !!cognitoIdentifier &&
      !!nextCognitoRole &&
      nextCognitoRole !== normalizeRole(previousRoleName);
    const shouldSyncCognitoProfile =
      !!cognitoIdentifier &&
      (user.username !== previousUsername || user.email !== previousEmail);
    const shouldSyncCognitoStatus =
      !!cognitoIdentifier && user.isActive !== previousIsActive;

    if (shouldSyncCognitoProfile && cognitoIdentifier) {
      await updateCognitoUserProfile(cognitoIdentifier, {
        email: user.email,
        name: user.username,
      });
    }

    if (shouldSyncCognitoStatus && cognitoIdentifier) {
      await setCognitoUserEnabled(cognitoIdentifier, user.isActive);
    }

    if (shouldSyncCognitoRole && nextCognitoRole && cognitoIdentifier) {
      await setCognitoUserRole(cognitoIdentifier, nextCognitoRole);
    }

    try {
      await AppDataSource.transaction(async (transactionManager) => {
        await transactionManager.save(User, user);
        if (jobTitleId !== undefined) {
          await transactionManager.save(EmployeeProfile, profile);
        }
      });
    } catch (error) {
      if (shouldSyncCognitoRole && previousRoleName && cognitoIdentifier) {
        await setCognitoUserRole(cognitoIdentifier, previousRoleName).catch(
          () => undefined
        );
      }
      if (shouldSyncCognitoStatus && cognitoIdentifier) {
        await setCognitoUserEnabled(cognitoIdentifier, previousIsActive).catch(
          () => undefined
        );
      }
      if (shouldSyncCognitoProfile && cognitoIdentifier) {
        await updateCognitoUserProfile(cognitoIdentifier, {
          email: previousEmail,
          name: previousUsername,
        }).catch(() => undefined);
      }
      throw error;
    }

    res.json(await loadSerializedUserById(user.id));

  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error, "Update failed") });
  }
};
