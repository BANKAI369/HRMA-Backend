import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { EmployeeService } from "../services/employee.service";
import { Roles } from "../utils/roles.enum";
import { resolveRequestRole } from "../utils/role.utils";

const service = new EmployeeService();

const nullableStringField = z
  .union([z.string().trim().min(1), z.literal(""), z.null()])
  .optional();

const createEmployeeSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().trim().min(6).optional(),
  role: z.nativeEnum(Roles).optional(),
  departmentId: nullableStringField,
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  dateOfBirth: z.string().trim().min(1).optional(),
  gender: z.string().trim().min(1).optional(),
  employeeCode: z.string().trim().min(1).optional(),
  dateOfJoining: z.string().trim().min(1).optional(),
  locationId: nullableStringField,
  jobTitleId: nullableStringField,
  managerUserId: nullableStringField,
  noticePeriodId: nullableStringField,
  groupId: nullableStringField,
});

const updatePersonalDetailsSchema = z.object({
  firstName: nullableStringField,
  lastName: nullableStringField,
  phone: nullableStringField,
  dateOfBirth: nullableStringField,
  gender: nullableStringField,
});

const updateJobDetailsSchema = z.object({
  employeeCode: nullableStringField,
  dateOfJoining: nullableStringField,
  locationId: nullableStringField,
  jobTitleId: nullableStringField,
  managerUserId: nullableStringField,
  noticePeriodId: nullableStringField,
  groupId: nullableStringField,
  departmentId: nullableStringField,
  role: nullableStringField,
  isActive: z.boolean().optional(),
});

const idParamSchema = z.object({
  id: z.string().trim().min(1, "Invalid id"),
});

export async function getEmployees(req: AuthRequest, res: Response) {
  try {
    const requesterRole = resolveRequestRole(req);
    if (requesterRole === Roles.Employee) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const employees = await service.findAll(search);
    res.json(employees);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch employees";
    res.status(500).json({ message });
  }
}

export async function getEmployee(req: AuthRequest, res: Response) {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const requesterRole = resolveRequestRole(req);
    const isSelf = req.user?.id === parsed.data.id;

    if (requesterRole === Roles.Employee && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const employee = await service.findOne(parsed.data.id);
    res.json(employee);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch employee";
    res.status(404).json({ message });
  }
}

export async function createEmployee(req: AuthRequest, res: Response) {
  try {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const requesterRole = resolveRequestRole(req);
    const selectedRole = parsed.data.role ?? Roles.Employee;

    if (requesterRole === Roles.Employee) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (requesterRole === Roles.Manager && selectedRole !== Roles.Employee) {
      return res.status(403).json({
        message: "Managers can only create employees",
      });
    }

    const result = await service.create({
      username: parsed.data.username,
      email: parsed.data.email,
      password: parsed.data.password,
      roleName: selectedRole,
      departmentId: parsed.data.departmentId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      dateOfBirth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      employeeCode: parsed.data.employeeCode,
      dateOfJoining: parsed.data.dateOfJoining,
      locationId: parsed.data.locationId,
      jobTitleId: parsed.data.jobTitleId,
      managerUserId: parsed.data.managerUserId,
      noticePeriodId: parsed.data.noticePeriodId,
      groupId: parsed.data.groupId,
    });

    res.status(201).json({
      ...result.employee,
      temporaryPassword: result.temporaryPassword,
      message: result.temporaryPassword
        ? `Employee created successfully. Temporary password: ${result.temporaryPassword}`
        : "Employee created successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create employee";
    res.status(400).json({ message });
  }
}

export async function updateEmployeePersonalDetails(
  req: AuthRequest,
  res: Response
) {
  try {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: paramsParsed.error.flatten().fieldErrors,
      });
    }

    const bodyParsed = updatePersonalDetailsSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: bodyParsed.error.flatten().fieldErrors,
      });
    }

    const requesterRole = resolveRequestRole(req);
    const isSelf = req.user?.id === paramsParsed.data.id;

    if (requesterRole === Roles.Employee && !isSelf) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const employee = await service.updatePersonalDetails(
      paramsParsed.data.id,
      bodyParsed.data
    );

    res.json(employee);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update employee personal details";
    res.status(400).json({ message });
  }
}

export async function updateEmployeeJobDetails(
  req: AuthRequest,
  res: Response
) {
  try {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: paramsParsed.error.flatten().fieldErrors,
      });
    }

    const bodyParsed = updateJobDetailsSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: bodyParsed.error.flatten().fieldErrors,
      });
    }

    const requesterRole = resolveRequestRole(req);
    if (requesterRole === Roles.Employee) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const employee = await service.updateJobDetails(
      paramsParsed.data.id,
      bodyParsed.data
    );

    res.json(employee);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update employee job details";
    res.status(400).json({ message });
  }
}
