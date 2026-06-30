import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizePermissions, authorizeRoles } from "../middleware/role.middleware";
import * as controller from "../controllers/modules.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("view_permissions"),
  controller.getModules
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("view_permissions"),
  controller.getModule
);

export default router;
