import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createUser,
  deleteUser,
  getCurrentUser,
  getUser,
  getUsers,
  getUsersByDepartment,
  updateUser,
} from "../controllers/user.controller";

const router = Router();

router.use(authenticate);
router.get("/", getUsers);
router.get("/me", getCurrentUser);
router.get("/department", getUsersByDepartment);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
