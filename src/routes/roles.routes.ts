import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  authorizePermissions,
  authorizeRoles,
} from "../middleware/role.middleware";
import * as controller from "../controllers/roles.controller";

const router = Router();

// Admin only routes
router.post(
  "/",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("manage_roles"),
  controller.createRole
);
router.get(
  "/",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("view_roles"),
  controller.getRoles
);
router.get(
  "/:id",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("view_roles"),
  controller.getRole
);
router.post(
  "/:id/permissions",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("assign_role_permissions"),
  controller.assignPermissions
);
router.put(
  "/:id/permissions",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("assign_role_permissions"),
  controller.updatePermissions
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("manage_roles"),
  controller.deleteRole
);

export default router;
