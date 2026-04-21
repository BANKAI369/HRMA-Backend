import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { ProjectStatus } from "../entities/Projects";
import { PsaService } from "../services/psa.service";

const service = new PsaService();

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
