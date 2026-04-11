import { z } from "zod";
import { DocumentStatus } from "../utils/document-status.enum";
import { Request, Response } from "express";
import * as documentService from "../services/document.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { resolveAuthenticatedUser } from "../utils/auth-user.utils";
import { deleteLocalFile } from "../utils/file-storage";
import {
  canAccessDocument,
  canAccessUserDocuments,
  canDeleteDocument,
  canReviewDocuments,
  getAccessibleDocumentUserIds,
} from "../services/document-access.service";

export const uploadDocumentSchema = z.object({
  userId: z.string().uuid("Valid userId is required"),
  documentTypeId: z.string().uuid("Valid documentTypeId is required"),
  remarks: z.string().max(500).optional(),
});

export const reviewDocumentSchema = z.object({
  status: z.nativeEnum(DocumentStatus),
  remarks: z.string().max(500).optional(),
}).refine(
  (data) =>
    data.status === DocumentStatus.VERIFIED ||
    data.status === DocumentStatus.REJECTED,
  {
    message: "Status must be VERIFIED or REJECTED",
    path: ["status"],
  }
);

const cleanupUploadedFile = async (req: Request) => {
  if (req.file?.path) {
    await deleteLocalFile(req.file.path);
  }
};

const loadDocumentActor = (req: AuthRequest) =>
  resolveAuthenticatedUser(req, ["role"]);

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const actor = await loadDocumentActor(req as AuthRequest);
    if (!actor) {
      await cleanupUploadedFile(req);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = uploadDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      await cleanupUploadedFile(req);
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const canUpload = await canAccessUserDocuments(actor, parsed.data.userId);
    if (!canUpload) {
      await cleanupUploadedFile(req);
      return res.status(403).json({ message: "Forbidden" });
    }

    const document = await documentService.createDocument({
      ...parsed.data,
      file: req.file,
    });

    return res.status(201).json({
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error: any) {
    await cleanupUploadedFile(req);
    return res.status(400).json({
      message: error.message || "Failed to upload document",
    });
  }
};

export const getAllDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await loadDocumentActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const accessibleUserIds = await getAccessibleDocumentUserIds(actor);
    const documents =
      accessibleUserIds === null
        ? await documentService.getAllDocuments()
        : await documentService.getDocumentsByUserIds(accessibleUserIds);

    return res.status(200).json(documents);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch documents",
    });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const document = await documentService.getDocumentById(req.params.id);
    const actor = await loadDocumentActor(req as AuthRequest);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const canView = await canAccessDocument(actor, document);
    if (!canView) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(document);
  } catch (error: any) {
    const message = error.message || "Document not found";
    const statusCode = message === "Document not found" ? 404 : 500;
    return res.status(statusCode).json({ message });
  }
};

export const getMyDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await loadDocumentActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const documents = await documentService.getDocumentsByUserId(actor.id);
    return res.status(200).json(documents);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch documents",
    });
  }
};

export const getDocumentsByUserId = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await loadDocumentActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const canView = await canAccessUserDocuments(actor, req.params.userId);
    if (!canView) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const documents = await documentService.getDocumentsByUserId(
      req.params.userId
    );
    return res.status(200).json(documents);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch user documents",
    });
  }
};

export const reviewDocument = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await loadDocumentActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!canReviewDocuments(actor)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const parsed = reviewDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const document = await documentService.reviewDocument(
      req.params.id,
      actor.id,
      parsed.data.status,
      parsed.data.remarks
    );

    return res.status(200).json({
      message: "Document reviewed successfully",
      data: document,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to review document",
    });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const actor = await loadDocumentActor(req as AuthRequest);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const document = await documentService.getDocumentById(req.params.id);
    const canDelete = await canDeleteDocument(actor, document);
    if (!canDelete) {
      return res.status(403).json({
        message:
          document.status === DocumentStatus.VERIFIED
            ? "Only admin or HR can delete verified documents"
            : "Forbidden",
      });
    }

    const result = await documentService.deleteDocument(req.params.id);
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error.message || "Failed to delete document";
    const statusCode = message === "Document not found" ? 404 : 400;
    return res.status(statusCode).json({ message });
  }
};
