import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import * as controller from "../controllers/documentType.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("Admin", "Manager", "Employee"),
  controller.getDocumentTypes
);
router.get(
  "/:id",
  authenticate,
  authorizeRoles("Admin", "Manager", "Employee"),
  controller.getDocumentType
);
router.post(
  "/",
  authenticate,
  authorizeRoles("Admin"),
  controller.createDocumentType
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("Admin"),
  controller.updateDocumentType
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Admin"),
  controller.deleteDocumentType
);

export default router;
