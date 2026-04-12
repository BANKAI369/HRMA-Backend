import { Router } from "express";
import * as documentController from "../controllers/document";
import { authenticate } from "../middleware/auth.middleware";
import { uploadDocument } from "../middleware/upload.middleware";

const router = Router();

router.use(authenticate);

router.post("/", uploadDocument.single("file"), documentController.uploadDocument);
router.get("/", documentController.getAllDocuments);
router.get("/my", documentController.getMyDocuments);
router.get("/user/:userId", documentController.getDocumentsByUserId);
router.get("/:id", documentController.getDocumentById);
router.patch("/:id/review", documentController.reviewDocument);
router.delete("/:id", documentController.deleteDocument);

export default router;
