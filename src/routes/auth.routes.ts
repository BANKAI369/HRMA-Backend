import { Router } from "express";
import {
  getCurrentAuthUser,
  register,
  signIn,
  syncAuthUser,
  resetPasswordDirect,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", signIn);
router.post("/reset-password", resetPasswordDirect);
router.get("/me", authenticate, getCurrentAuthUser);
router.post("/sync", authenticate, syncAuthUser);

export default router;
