import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  authorizePermissions,
  authorizeRoles,
} from "../middleware/role.middleware";
import * as controller from "../controllers/roles.controller";

const router = Router();

// Admin only routes
<<<<<<< Updated upstream
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
=======
router.post("/", authenticate, authorizeRoles("Admin"), controller.createRole);
router.get("/", authenticate, authorizeRoles("Admin"), controller.getRoles);
router.get("/:id", authenticate, authorizeRoles("Admin"), controller.getRole);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
router.post(
  "/:id/permissions",
  authenticate,
  authorizeRoles("Admin"),
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  authorizePermissions("assign_role_permissions"),
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  controller.assignPermissions
);
router.put(
  "/:id/permissions",
  authenticate,
  authorizeRoles("Admin"),
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
  controller.updatePermissions
);
router.delete("/:id", authenticate, authorizeRoles("Admin"), controller.deleteRole);
>>>>>>> Stashed changes

export default router;
