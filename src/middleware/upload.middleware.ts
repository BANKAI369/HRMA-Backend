import multer from "multer";
import path from "path";
import { ensureDirectoryExists, resolveDocumentUploadDirectory } from "../utils/file-storage";

const uploadDir = resolveDocumentUploadDirectory();

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await ensureDirectoryExists(uploadDir);
      callback(null, uploadDir);
    } catch (error) {
      callback(error as Error, uploadDir);
    }
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80);
    const uniqueName = `${Date.now()}-${safeBaseName || "document"}${extension}`;
    callback(null, uniqueName);
  },
});

export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
