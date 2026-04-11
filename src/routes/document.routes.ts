import { Router } from "express";
import * as documentController from "../controllers/document";
import { authenticate } from "../middleware/auth.middleware";
import { uploadDocument } from "../middleware/upload.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  uploadDocument.single("file"),
  documentController.uploadDocument
);

router.get(
  "/",
  authenticate,
  documentController.getAllDocuments
);

router.get(
  "/my",
  authenticate,
  documentController.getMyDocuments
);

router.get(
  "/user/:userId",
  authenticate,
  documentController.getDocumentsByUserId
);

router.get(
  "/:id",
  authenticate,
  documentController.getDocumentById
);

router.patch(
  "/:id/review",
  authenticate,
  documentController.reviewDocument
);

router.delete(
  "/:id",
  authenticate,
  documentController.deleteDocument
);

export default router;
