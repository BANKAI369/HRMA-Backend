import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import * as controller from "../controllers/roles.controller";

const router = Router();

// Admin only routes
router.post("/", authenticate, authorizeRoles("Admin"), controller.createRole);
router.get("/", authenticate, authorizeRoles("Admin"), controller.getRoles);
router.get("/:id", authenticate, authorizeRoles("Admin"), controller.getRole);
router.post(
  "/:id/permissions",
  authenticate,
  authorizeRoles("Admin"),
  controller.assignPermissions
);
router.put(
  "/:id/permissions",
  authenticate,
  authorizeRoles("Admin"),
  controller.updatePermissions
);
router.delete("/:id", authenticate, authorizeRoles("Admin"), controller.deleteRole);

export default router;
