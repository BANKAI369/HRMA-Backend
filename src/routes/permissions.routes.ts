import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  authorizePermissions,
  authorizeRoles,
} from "../middleware/role.middleware";
import * as controller from "../controllers/permissions.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("view_permissions"),
  controller.getPermissions
);

export default router;
