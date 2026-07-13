import multer from "multer";
import path from "path";
import { ensureDirectoryExists, resolveDocumentUploadDirectory } from "../utils/file-storage";

const uploadDir = resolveDocumentUploadDirectory();
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"]);

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
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      const error = new Error(
        "Only PDF, JPG, JPEG, PNG, DOC, and DOCX files are allowed"
      ) as Error & { status?: number };
      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
});
