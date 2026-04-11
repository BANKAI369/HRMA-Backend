import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import * as service from "../services/documentType.service";

const createDocumentTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
});

const updateDocumentTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  description: z.string().trim().min(1, "Description is required").optional(),
  isActive: z.boolean().optional(),
});

const idParamSchema = z.object({
  id: z.string().trim().min(1, "Invalid document type id"),
});

const sendValidationError = (res: Response, error: z.ZodError) =>
  res.status(400).json({
    message: "Invalid request",
    errors: error.flatten().fieldErrors,
  });

export async function createDocumentType(req: AuthRequest, res: Response) {
  try {
    const parsed = createDocumentTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error);
    }

    const documentType = await service.createDocumentType(parsed.data);
    res.status(201).json(documentType);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create document type";
    res.status(400).json({ message });
  }
}

export async function getDocumentTypes(req: AuthRequest, res: Response) {
  try {
    res.json(await service.getDocumentTypes());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch document types";
    res.status(500).json({ message });
  }
}

export async function getDocumentType(req: AuthRequest, res: Response) {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error);
    }

    res.json(await service.getDocumentTypeById(parsed.data.id));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Document type not found";
    res.status(404).json({ message });
  }
}

export async function updateDocumentType(req: AuthRequest, res: Response) {
  try {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return sendValidationError(res, paramsParsed.error);
    }

    const bodyParsed = updateDocumentTypeSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return sendValidationError(res, bodyParsed.error);
    }

    const documentType = await service.updateDocumentType(
      paramsParsed.data.id,
      bodyParsed.data
    );
    res.json(documentType);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update document type";
    res.status(400).json({ message });
  }
}

export async function deleteDocumentType(req: AuthRequest, res: Response) {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return sendValidationError(res, parsed.error);
    }

    res.json(await service.deleteDocumentType(parsed.data.id));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete document type";
    res.status(404).json({ message });
  }
}
