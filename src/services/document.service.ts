import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Document } from "../entities/Document";
import { DocumentType } from "../entities/DocumentTypes";
import { User } from "../entities/User";
import { auditLogService, buildAuditDiff } from "./audit-log.service";
import { deleteLocalFile } from "../utils/file-storage";
import { DocumentStatus } from "../utils/document-status.enum";

const documentRepo = AppDataSource.getRepository(Document);
const userRepo = AppDataSource.getRepository(User);
const documentTypeRepo = AppDataSource.getRepository(DocumentType);

export type UploadDocumentInput = {
  userId: string;
  documentTypeId: string;
  remarks?: string;
  file: {
    filename: string;
    originalname: string;
    path: string;
    mimetype: string;
    size: number;
  };
};

export type ListDocumentsInput = {
  accessibleUserIds?: string[] | null;
  status?: DocumentStatus;
  documentTypeId?: string;
  search?: string;
  page: number;
  pageSize: number;
};

const buildDocumentSnapshot = (document: Document) => ({
  userId: document.userId,
  documentTypeId: document.documentTypeId,
  originalFileName: document.originalFileName,
  mimeType: document.mimeType,
  fileSize: Number(document.fileSize),
  status: document.status,
  remarks: document.remarks ?? null,
  verifiedBy: document.verifiedBy ?? null,
  verifiedAt: document.verifiedAt?.toISOString?.() ?? null,
});

export const createDocument = async (
  input: UploadDocumentInput,
  options: { actorUserId?: string | null } = {}
) => {
  const user = await userRepo.findOne({ where: { id: input.userId } });
  if (!user) {
    await deleteLocalFile(input.file.path);
    throw new Error("User not found");
  }

  const documentType = await documentTypeRepo.findOne({
    where: { id: input.documentTypeId, isActive: true },
  });

  if (!documentType) {
    await deleteLocalFile(input.file.path);
    throw new Error("Document type not found or inactive");
  }

  const documentId = await AppDataSource.transaction(async (manager) => {
    const document = manager.create(Document, {
      userId: input.userId,
      documentTypeId: input.documentTypeId,
      fileName: input.file.filename,
      originalFileName: input.file.originalname,
      filePath: input.file.path,
      mimeType: input.file.mimetype,
      fileSize: input.file.size,
      remarks: input.remarks,
      status: DocumentStatus.PENDING,
    });

    const savedDocument = await manager.save(Document, document);
    await auditLogService.log(
      {
        actorUserId: options.actorUserId ?? null,
        action: "DOCUMENT_CREATED",
        entityType: "document",
        entityId: savedDocument.id,
        newValue: buildDocumentSnapshot(savedDocument),
      },
      manager
    );

    return savedDocument.id;
  });

  return getDocumentById(documentId);
};

export const getAllDocuments = async () =>
  documentRepo.find({
    relations: ["user", "documentType"],
    order: { createdAt: "DESC" },
  });

export const listDocuments = async (input: ListDocumentsInput) => {
  if (input.accessibleUserIds && !input.accessibleUserIds.length) {
    return {
      data: [],
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const query = documentRepo
    .createQueryBuilder("document")
    .leftJoinAndSelect("document.user", "user")
    .leftJoinAndSelect("document.documentType", "documentType")
    .orderBy("document.createdAt", "DESC")
    .skip((input.page - 1) * input.pageSize)
    .take(input.pageSize);

  if (input.accessibleUserIds) {
    query.andWhere("document.userId IN (:...accessibleUserIds)", {
      accessibleUserIds: input.accessibleUserIds,
    });
  }

  if (input.status) {
    query.andWhere("document.status = :status", { status: input.status });
  }

  if (input.documentTypeId) {
    query.andWhere("document.documentTypeId = :documentTypeId", {
      documentTypeId: input.documentTypeId,
    });
  }

  if (input.search) {
    query.andWhere(
      `(LOWER(document.originalFileName) LIKE :search OR LOWER(COALESCE(document.remarks, '')) LIKE :search)`,
      {
        search: `%${input.search.toLowerCase()}%`,
      }
    );
  }

  const [documents, total] = await query.getManyAndCount();

  return {
    data: documents,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: total ? Math.ceil(total / input.pageSize) : 0,
    },
  };
};

export const getDocumentById = async (id: string) => {
  const document = await documentRepo.findOne({
    where: { id },
    relations: ["user", "documentType"],
  });

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
};

export const getDocumentsByUserId = async (userId: string) =>
  documentRepo.find({
    where: { userId },
    relations: ["user", "documentType"],
    order: { createdAt: "DESC" },
  });

export const getDocumentsByUserIds = async (userIds: string[]) => {
  if (!userIds.length) {
    return [];
  }

  return documentRepo.find({
    where: { userId: In(userIds) },
    relations: ["user", "documentType"],
    order: { createdAt: "DESC" },
  });
};

export const reviewDocument = async (
  id: string,
  reviewerId: string,
  status: DocumentStatus,
  remarks?: string
) => {
  const document = await documentRepo.findOne({ where: { id } });

  if (!document) {
    throw new Error("Document not found");
  }

  const previousSnapshot = buildDocumentSnapshot(document);
  document.status = status;
  document.remarks = remarks ?? document.remarks;
  document.verifiedBy = reviewerId;
  document.verifiedAt = new Date();

  const updatedDocument = await documentRepo.save(document);
  const auditDiff = buildAuditDiff(
    previousSnapshot,
    buildDocumentSnapshot(updatedDocument)
  );

  if (auditDiff.hasChanges) {
    await auditLogService.log({
      actorUserId: reviewerId,
      action: "DOCUMENT_REVIEWED",
      entityType: "document",
      entityId: updatedDocument.id,
      oldValue: auditDiff.oldValue,
      newValue: auditDiff.newValue,
    });
  }

  return updatedDocument;
};

export const logDocumentDownload = async (
  document: Document,
  actorUserId: string
) =>
  auditLogService.log({
    actorUserId,
    action: "DOCUMENT_DOWNLOADED",
    entityType: "document",
    entityId: document.id,
    newValue: {
      originalFileName: document.originalFileName,
      mimeType: document.mimeType,
      status: document.status,
    },
  });

export const deleteDocument = async (
  id: string,
  options: { actorUserId?: string | null } = {}
) => {
  const document = await documentRepo.findOne({ where: { id } });

  if (!document) {
    throw new Error("Document not found");
  }

  await deleteLocalFile(document.filePath);
  await AppDataSource.transaction(async (manager) => {
    await manager.remove(Document, document);
    await auditLogService.log(
      {
        actorUserId: options.actorUserId ?? null,
        action: "DOCUMENT_DELETED",
        entityType: "document",
        entityId: document.id,
        oldValue: buildDocumentSnapshot(document),
      },
      manager
    );
  });

  return { message: "Document deleted successfully" };
};
