import { mkdir, unlink } from "fs/promises";
import path from "path";

export const ensureDirectoryExists = async (directoryPath: string) => {
  await mkdir(directoryPath, { recursive: true });
};

export const resolveDocumentUploadDirectory = () =>
  path.join(process.cwd(), "uploads", "documents");

export const deleteLocalFile = async (filePath: string) => {
  try {
    await unlink(filePath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};
