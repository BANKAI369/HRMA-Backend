import { AppDataSource } from "../config/data-source";
import { DocumentType } from "../entities/DocumentTypes";

const repo = AppDataSource.getRepository(DocumentType);

export const createDocumentType = async (data: {
  name: string;
  description: string;
}) => {
  const normalizedName = data.name.trim();
  const normalizedDescription = data.description.trim();

  const existing = await repo.findOne({ where: { name: normalizedName } });
  if (existing) {
    throw new Error("Document type already exists");
  }

  const docType = repo.create({
    name: normalizedName,
    description: normalizedDescription,
    isActive: true,
  });
  return await repo.save(docType);
};

export const getDocumentTypes = async () => {
  return await repo.find({
    where: { isActive: true },
    order: { createdAt: "DESC" },
  });
};

export const getDocumentTypeById = async (id: string) => {
  const docType = await repo.findOne({ where: { id } });
  if (!docType) throw new Error("Document type not found");
  return docType;
};

export const updateDocumentType = async (
  id: string,
  data: Partial<DocumentType>
) => {
  const docType = await repo.findOne({ where: { id } });
  if (!docType) throw new Error("Document type not found");

  if (typeof data.name === "string") {
    const normalizedName = data.name.trim();
    const existing = await repo.findOne({ where: { name: normalizedName } });

    if (existing && existing.id !== id) {
      throw new Error("Document type already exists");
    }

    docType.name = normalizedName;
  }

  if (typeof data.description === "string") {
    docType.description = data.description.trim();
  }

  if (typeof data.isActive === "boolean") {
    docType.isActive = data.isActive;
  }

  return await repo.save(docType);
};

export const deleteDocumentType = async (id: string) => {
  const docType = await repo.findOne({ where: { id } });
  if (!docType) throw new Error("Document type not found");

  docType.isActive = false;
  await repo.save(docType);
  return { message: "Document type deleted successfully" };
};
