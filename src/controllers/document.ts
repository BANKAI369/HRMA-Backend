import { Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import * as documentService from "../services/document.service";
import {
  canAccessDocument,
  canAccessUserDocuments,
  canDeleteDocument,
  canReviewDocuments,
  getAccessibleDocumentUserIds,
} from "../services/document-access.service";
import { resolveAuthenticatedUser } from "../utils/auth-user.utils";
import { DocumentStatus } from "../utils/document-status.enum";
import { deleteLocalFile, localFileExists } from "../utils/file-storage";

export const uploadDocumentSchema = z.object({
  userId: z.string().uuid("Valid userId is required"),
  documentTypeId: z.string().uuid("Valid documentTypeId is required"),
  remarks: z.string().max(500).optional(),
});

const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(DocumentStatus).optional(),
  documentTypeId: z.string().uuid("Valid documentTypeId is required").optional(),
  search: z.string().trim().max(200).optional(),
});

export const reviewDocumentSchema = z
  .object({
    status: z.nativeEnum(DocumentStatus),
    remarks: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      data.status === DocumentStatus.VERIFIED ||
      data.status === DocumentStatus.REJECTED,
    {
      message: "Status must be VERIFIED or REJECTED",
      path: ["status"],
    }
  );

const cleanupUploadedFile = async (req: Request) => {
  const filePath = (req as Request & { file?: { path?: string } }).file?.path;

  if (filePath) {
    await deleteLocalFile(filePath);
  }
};

const resolveDocumentActor = (req: AuthRequest) =>
  resolveAuthenticatedUser(req, ["role"]);

const parseListDocumentsQuery = (query: AuthRequest["query"]) => {
  const parsed = listDocumentsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const actor = await resolveDocumentActor(req as AuthRequest);
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

    const requestWithFile = req as Request & {
      file?: {
        filename: string;
        originalname: string;
        path: string;
        mimetype: string;
        size: number;
      };
    };

    if (!requestWithFile.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const canUpload = await canAccessUserDocuments(actor, parsed.data.userId);
    if (!canUpload) {
      await cleanupUploadedFile(req);
      return res.status(403).json({ message: "Forbidden" });
    }

    const document = await documentService.createDocument({
      ...parsed.data,
      file: requestWithFile.file,
    }, {
      actorUserId: actor.id,
    });

    return res.status(201).json({
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error: any) {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      await cleanupUploadedFile(req);
      return res.status(400).json({
        message: "File size must not exceed 10 MB",
      });
    }

    if (typeof error?.status === "number" && error.status === 400) {
      await cleanupUploadedFile(req);
      return res.status(400).json({
        message: error.message || "Invalid file upload",
      });
    }

    await cleanupUploadedFile(req);
    return res.status(400).json({
      message: error.message || "Failed to upload document",
    });
  }
};

export const getAllDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveDocumentActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsedQuery = parseListDocumentsQuery(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsedQuery.error,
      });
    }

    const accessibleUserIds = await getAccessibleDocumentUserIds(actor);
    const result = await documentService.listDocuments({
      accessibleUserIds,
      ...parsedQuery.data,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch documents",
    });
  }
};

export const getMyDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveDocumentActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsedQuery = parseListDocumentsQuery(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsedQuery.error,
      });
    }

    const result = await documentService.listDocuments({
      accessibleUserIds: [actor.id],
      ...parsedQuery.data,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch documents",
    });
  }
};

export const getDocumentsByUserId = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveDocumentActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsedQuery = parseListDocumentsQuery(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsedQuery.error,
      });
    }

    const canView = await canAccessUserDocuments(actor, req.params.userId);
    if (!canView) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await documentService.listDocuments({
      accessibleUserIds: [req.params.userId],
      ...parsedQuery.data,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch user documents",
    });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveDocumentActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const document = await documentService.getDocumentById(req.params.id);
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

export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveDocumentActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const document = await documentService.getDocumentById(req.params.id);
    const canView = await canAccessDocument(actor, document);
    if (!canView) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const fileExists = await localFileExists(document.filePath);
    if (!fileExists) {
      return res.status(404).json({ message: "Document file not found" });
    }

    await documentService.logDocumentDownload(document, actor.id);
    return res.download(document.filePath, document.originalFileName);
  } catch (error: any) {
    const message = error.message || "Failed to download document";
    const statusCode = message === "Document not found" ? 404 : 500;
    return res.status(statusCode).json({ message });
  }
};

export const reviewDocument = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveDocumentActor(req);
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

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveDocumentActor(req);
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

    const result = await documentService.deleteDocument(req.params.id, {
      actorUserId: actor.id,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    const message = error.message || "Failed to delete document";
    const statusCode = message === "Document not found" ? 404 : 400;
    return res.status(statusCode).json({ message });
  }
};
