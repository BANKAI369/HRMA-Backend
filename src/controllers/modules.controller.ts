import { Request, Response } from "express";
import { z } from "zod";
import * as service from "../services/modules.service";

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid module id"),
});

export async function getModules(req: Request, res: Response) {
  const modules = await service.findAllModules();
  res.json(modules);
}

export async function getModule(req: Request, res: Response) {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const moduleEntity = await service.findModuleById(parsed.data.id);
    res.json(moduleEntity);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
}
