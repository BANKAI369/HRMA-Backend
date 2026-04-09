import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createExitRequest,
  updateExitRequest,
} from "../controllers/exit-request.controller";

const router = Router();

router.use(authenticate);
router.post("/", createExitRequest);
router.put("/:id", updateExitRequest);

export default router;
