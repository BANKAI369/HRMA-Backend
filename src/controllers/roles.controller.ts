import { Request, Response } from "express";
import { z } from "zod";
import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/role";
import { AuthRequest } from "../middleware/auth.middleware";
import * as service from "../services/roles.service";

const roleRepo = AppDataSource.getRepository(Role);

const sendValidationError = (res: Response, error: z.ZodError) =>
  res.status(400).json({
    message: "Invalid request",
    errors: error.flatten().fieldErrors,
  });

const roleRepo = AppDataSource.getRepository(Role);

const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required"),
});

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid role id"),
});

const assignPermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().trim().min(1, "Permission id is required"))
    .min(1, "At least one permission id is required"),
});

const updatePermissionsSchema = z.object({
  permissionIds: z.array(z.string().trim().min(1, "Permission id is required")),
});

export async function createRole(req: AuthRequest, res: Response) {
  try {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const role = await service.createRole(parsed.data.name);
    res.status(201).json(role);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export const getRoles = async (req: Request, res: Response) => {
  const roles = await roleRepo.find({
    relations: ["permissions"],
  });

  res.json(roles);
}

export async function getRole(req: AuthRequest, res: Response) {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const role = await service.findRoleById(parsed.data.id);
    res.json(role);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
}

export async function deleteRole(req: AuthRequest, res: Response){
    try{ 
        const parsed = idParamSchema.safeParse(req.params);
        if (!parsed.success) {
          return res.status(400).json({
            message: "Invalid request",
            errors: parsed.error.flatten().fieldErrors,
          });
        }
        const result = await service.deleteRole(parsed.data.id);
        res.json(result);
    } catch (error: any) {
        res.status(404).json({message: error.message});
    }
}

export async function assignPermissions(req: AuthRequest, res: Response) {
  try {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return sendValidationError(res, paramsParsed.error);
    }

    const bodyParsed = assignPermissionsSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return sendValidationError(res, bodyParsed.error);
    }

    const role = await service.assignPermissionsToRole(
      paramsParsed.data.id,
      bodyParsed.data.permissionIds
    );

    res.status(200).json(role);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function updatePermissions(req: AuthRequest, res: Response) {
  try {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return sendValidationError(res, paramsParsed.error);
    }

    const bodyParsed = updatePermissionsSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return sendValidationError(res, bodyParsed.error);
    }

    const role = await service.updateRolePermissions(
      paramsParsed.data.id,
      bodyParsed.data.permissionIds
    );

    res.status(200).json(role);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}
