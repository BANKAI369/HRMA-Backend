import { Router } from "express";
import {
  getCurrentAuthUser,
  login,
  register,
  resetPassword,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/signup", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getCurrentAuthUser);
router.post("/sync", authenticate, getCurrentAuthUser);

export default router;
