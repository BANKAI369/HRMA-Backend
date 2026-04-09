import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import * as controller from "../controllers/permissions.controller";

const router = Router();

router.get("/", authenticate, authorizeRoles("Admin"), controller.getPermissions);

export default router;
