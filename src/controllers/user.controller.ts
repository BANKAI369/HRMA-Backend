//auth.controller.ts
import { Request, Response } from "express";
import { z } from "zod";
import { UserService } from "../services/user.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Role } from "../entities/role";
import { Department } from "../entities/Department";

import { Roles } from "../utils/roles.enum";
import { normalizeRole, resolveRequestRole } from "../utils/role.utils";

const service = new UserService();

const createUserSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  email: z.string().email("Invalid email format"),
  role: z.nativeEnum(Roles).optional(),
});

const updateUserSchema = z.object({
  username: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  departmentId: z.union([z.string().trim().min(1), z.literal(""), z.null()]).optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const serializeUser = (user: User | null) => {
  if (!user) {
    return null;
  }

  const { password: _password, resetToken: _resetToken, ...safeUser } = user;
  return safeUser;
};

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
  const currentUserId = req.user?.id;
  const currentUserEmail = req.user?.email || null;

  if (!currentUserId && !currentUserEmail) {
    return null;
  }

  return userRepo.findOne({
    where: [
      currentUserEmail ? { email: currentUserEmail } : undefined,
      currentUserId ? { id: currentUserId } : undefined,
    ].filter(Boolean) as Array<{ id?: string; email?: string }>,
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

    const { username, email, role } = parsed.data;
    const requesterRole = resolveRequestRole(req);
    const selectedRole = role ?? Roles.Employee;

    if (requesterRole === Roles.Manager && selectedRole !== Roles.Employee) {
      return res.status(403).json({
        message: "Managers can only create employees",
      });
    }

    const { user, temporaryPassword } = await service.create({
      username,
      email,
      roleName: selectedRole,
    });

    res.status(201).json({
      ...serializeUser(user),
      temporaryPassword,
      message: temporaryPassword
        ? `User created successfully. Temporary password: ${temporaryPassword}`
        : "User created successfully.",
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
    const departmentRepo = AppDataSource.getRepository(Department);
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { id } = parsed.data;

    const user = await userRepo.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const managedDepartments = user
      ? await departmentRepo.find({
          where: { manager: { id: user.id } },
          relations: ["manager"],
        })
      : [];

    if (user) {
      await AppDataSource.transaction(async (transactionManager) => {
        if (managedDepartments.length > 0) {
          for (const department of managedDepartments) {
            department.manager = null as any;
            await transactionManager.save(Department, department);
          }
        }

        user.isActive = false;
        user.role = null;
        user.department = null;
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
    )
      .filter((user) => !isSoftDeletedUser(user))
      .map((user) => ({
        id: user.id,
        localUserId: user.id,
        hasLocalProfile: true,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        department: user.department,
        createdAt: user.createdAt?.toISOString?.(),
        updatedAt: user.updatedAt?.toISOString?.(),
      }))
      .filter((user) => {
        if (requesterEmail && user.email === requesterEmail) {
          return false;
        }

        if (!requesterEmail && requesterId && user.localUserId === requesterId) {
          return false;
        }

        if (!search) {
          return true;
        }

        const searchable = [
          user.username,
          user.email,
          typeof user.role === "string" ? user.role : user.role?.name,
          user.department?.name,
        ]
          .filter((value): value is string => Boolean(value))
          .join(" ")
          .toLowerCase();

        return searchable.includes(search);
      })
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });

    res.json(users);

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

    res.json(serializeUser(currentUser));
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

    res.json(users.map((user) => serializeUser(user)));
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

    const requesterEmail = req.user?.email || null;
    const isSelf =
      (requesterEmail && user.email === requesterEmail) ||
      req.user?.id === requestedUserId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(serializeUser(user));

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

    const { username, email, role, isActive, departmentId } = bodyParsed.data;
    
    let user = await userRepo.findOne({
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
      }
    }

    if (departmentId === null || departmentId === "") {
      const managedDepartment = await departmentRepo.findOne({
        where: { manager: { id: user.id } },
        relations: ["manager"],
      });

      if (managedDepartment) {
        managedDepartment.manager = null as any;
        await departmentRepo.save(managedDepartment);
      }
    }

    if (isManagerAfterUpdate && nextDepartmentId) {
      const existingManager = await userRepo
        .createQueryBuilder("u")
        .leftJoin("u.role", "role")
        .where("role.name = :roleName", { roleName: "Manager" })
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

      const existingManagerDept = await departmentRepo.findOne({
        where: { manager: { id: user.id } },
        relations: ["manager"],
      });

      if (existingManagerDept && existingManagerDept.id !== nextDepartmentId) {
        return res
          .status(400)
          .json({ message: "Manager is already assigned to another department" });
      }

      const targetDepartment = await departmentRepo.findOne({
        where: { id: nextDepartmentId },
        relations: ["manager"],
      });

      if (!targetDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }

      if (
        targetDepartment.manager &&
        targetDepartment.manager.id !== user.id
      ) {
        return res
          .status(400)
          .json({ message: "Department already has a manager" });
      }

      targetDepartment.manager = user;
      await departmentRepo.save(targetDepartment);
    }

    if (!isManagerAfterUpdate) {
      const managedDepartment = await departmentRepo.findOne({
        where: { manager: { id: user.id } },
        relations: ["manager"],
      });

      if (managedDepartment) {
        managedDepartment.manager = null as any;
        await departmentRepo.save(managedDepartment);
      }
    }

    await userRepo.save(user);
    
    const updatedUser = await userRepo.findOne({
      where: { id: user.id },
      relations: ["role", "department"],
    });

    res.json(serializeUser(updatedUser));

  } catch (error) {
    res.status(500).json({ message: getErrorMessage(error, "Update failed") });
  }
};
