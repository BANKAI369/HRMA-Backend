import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { ProjectStatus } from "../entities/Projects";
import { PsaService } from "../services/psa.service";
import { TaskStatus } from "../entities/ProjectTask";

const service: PsaService = new PsaService();

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

const createClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required"),
  contactPerson: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

const updateClientSchema = createClientSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" }
);

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  code: z.string().trim().min(1, "Project code is required"),
  description: z.string().trim().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  clientId: z.string().min(1, "Client id is required"),
});

const updateProjectSchema = createProjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const createProjectPhaseSchema = z.object({
  name: z.string().trim().min(1, "Phase name is required"),
  description: z.string().trim().optional(),
  phaseOrder: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  projectId: z.string().min(1, "Project id is required"),
});

const projectPhaseQuerySchema = z.object({
  projectId: z.string().min(1).optional(),
});

const projectIdParamSchema = z.object({
  projectId: z.string().min(1, "Invalid projectId"),
});

const taskIdParamSchema = z.object({
  taskId: z.string().min(1, "Invalid taskId"),
});

const createAllocationSchema = z.object({
  userId: z.string().uuid("Valid userId is required"),
  projectId: z.string().min(1, "Project id is required"),
  allocationPercentage: z.coerce.number().int().min(0).max(100).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required"),
  description: z.string().trim().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  projectId: z.string().min(1, "Project id is required"),
});

const updateTaskSchema = createTaskSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" }
);

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const normalized = message.toLowerCase();

  if (normalized.includes("not found")) {
    return res.status(404).json({ message });
  }

  if (normalized.includes("already exists")) {
    return res.status(409).json({ message });
  }

  return res.status(400).json({ message });
};

export const getClients = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listClients());
  } catch (error) {
    return handleError(res, error, "Failed to fetch clients");
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  const parsed = createClientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(201).json(await service.createClient(parsed.data));
  } catch (error) {
    return handleError(res, error, "Failed to create client");
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(200).json(await service.getClient(parsed.data.id));
  } catch (error) {
    return handleError(res, error, "Failed to fetch client");
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  const bodyParsed = updateClientSchema.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: {
        ...(paramsParsed.success ? {} : paramsParsed.error.flatten().fieldErrors),
        ...(bodyParsed.success ? {} : bodyParsed.error.flatten().fieldErrors),
      },
    });
  }

  try {
    return res
      .status(200)
      .json(await service.updateClient(paramsParsed.data.id, bodyParsed.data));
  } catch (error) {
    return handleError(res, error, "Failed to update client");
  }
};

export const getBillingRoles = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listBillingRoles());
  } catch (error) {
    return handleError(res, error, "Failed to fetch billing roles");
  }
};

export const getProjectPhases = async (req: AuthRequest, res: Response) => {
  const parsed = projectPhaseQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(200).json(await service.listProjectPhases(parsed.data.projectId));
  } catch (error) {
    return handleError(res, error, "Failed to fetch project phases");
  }
};

export const createProjectPhase = async (req: AuthRequest, res: Response) => {
  const parsed = createProjectPhaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(201).json(await service.createProjectPhase(parsed.data));
  } catch (error) {
    return handleError(res, error, "Failed to create project phase");
  }
};

export const getProjects = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listProjects());
  } catch (error) {
    return handleError(res, error, "Failed to fetch projects");
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(201).json(await service.createProject(parsed.data));
  } catch (error) {
    return handleError(res, error, "Failed to create project");
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(200).json(await service.getProject(parsed.data.id));
  } catch (error) {
    return handleError(res, error, "Failed to fetch project");
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  const bodyParsed = updateProjectSchema.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: {
        ...(paramsParsed.success ? {} : paramsParsed.error.flatten().fieldErrors),
        ...(bodyParsed.success ? {} : bodyParsed.error.flatten().fieldErrors),
      },
    });
  }

  try {
    return res
      .status(200)
      .json(await service.updateProject(paramsParsed.data.id, bodyParsed.data));
  } catch (error) {
    return handleError(res, error, "Failed to update project");
  }
};
export const getAllocations = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.getProjectAllocations());
  } catch (error) {
    return handleError(res, error, "Failed to fetch project allocations");
  }
};

export const createAllocation = async (req: AuthRequest, res: Response) => {
  const parsed = createAllocationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(201).json(await service.createProjectAllocation(parsed.data));
  } catch (error) {
    return handleError(res, error, "Failed to create project allocation");
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  const parsed = projectIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(200).json(await service.getProjectTasks(parsed.data.projectId));
  } catch (error) {
    return handleError(res, error, "Failed to fetch project tasks");
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(201).json(await service.createProjectTask(parsed.data));
  } catch (error) {
    return handleError(res, error, "Failed to create project task");
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  const bodyParsed = updateTaskSchema.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: {
        ...(paramsParsed.success ? {} : paramsParsed.error.flatten().fieldErrors),
        ...(bodyParsed.success ? {} : bodyParsed.error.flatten().fieldErrors),
      },
    });
  }

  try {
    return res
      .status(200)
      .json(await service.updateProjectTask(paramsParsed.data.id, bodyParsed.data));
  } catch (error) {
    return handleError(res, error, "Failed to update project task");
  }
};

export const getTaskAssignees = async (req: AuthRequest, res: Response) => {
  const parsed = projectIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(200).json(await service.getTaskAssignees(parsed.data.projectId));
  } catch (error) {
    return handleError(res, error, "Failed to fetch project assignees");
  }
};

export const getTimesheets = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.getTimesheetEntries());
  } catch (error) {
    return handleError(res, error, "Failed to fetch timesheet entries");
  }
};

export const getProjectTimesheets = async (req: AuthRequest, res: Response) => {
  const parsed = projectIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res
      .status(200)
      .json(await service.getProjectTimesheetEntries(parsed.data.projectId));
  } catch (error) {
    return handleError(res, error, "Failed to fetch project timesheets");
  }
};

export const getTaskTimesheets = async (req: AuthRequest, res: Response) => {
  const parsed = taskIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    return res.status(200).json(await service.getTaskTimeEntries(parsed.data.taskId));
  } catch (error) {
    return handleError(res, error, "Failed to fetch task time entries");
  }
};
