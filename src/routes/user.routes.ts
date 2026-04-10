import { Router } from "express";
import {
  getUsers,
  getCurrentUser,
  getUser,
  updateUser,
  deleteUser,
  createUser,
  getUsersByDepartment,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  authorizePermissions,
  authorizeRoles,
} from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("Admin", "Manager"),
  authorizePermissions("create_user"),
  createUser
);
router.get(
  "/",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("view_users"),
  getUsers
);
router.get(
  "/me",
  authenticate,
  authorizeRoles("Admin", "Employee", "Manager"),
  authorizePermissions("view_self"),
  getCurrentUser
);
router.get("/department", authenticate, authorizeRoles("Admin", "Employee", "Manager"), getUsersByDepartment);
router.get("/:id", authenticate, authorizeRoles("Admin", "Manager", "Employee"), getUser);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("Admin", "Manager"),
  authorizePermissions("update_user"),
  updateUser
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Admin"),
  authorizePermissions("delete_user"),
  deleteUser
);

export default router;
