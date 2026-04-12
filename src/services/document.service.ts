import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Document } from "../entities/Document";
import { DocumentType } from "../entities/DocumentTypes";
import { User } from "../entities/User";
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

export const createDocument = async (input: UploadDocumentInput) => {
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

  const document = documentRepo.create({
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

  return documentRepo.save(document);
};

export const getAllDocuments = async () =>
  documentRepo.find({
    relations: ["user", "documentType"],
    order: { createdAt: "DESC" },
  });

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

  document.status = status;
  document.remarks = remarks ?? document.remarks;
  document.verifiedBy = reviewerId;
  document.verifiedAt = new Date();

  return documentRepo.save(document);
};

export const deleteDocument = async (id: string) => {
  const document = await documentRepo.findOne({ where: { id } });

  if (!document) {
    throw new Error("Document not found");
  }

  await deleteLocalFile(document.filePath);
  await documentRepo.remove(document);

  return { message: "Document deleted successfully" };
};
