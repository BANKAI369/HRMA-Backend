import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as controller from "../controllers/leave.controller";

const router = Router();

router.use(authenticate);

router.post("/", controller.createLeaveType);
router.get("/", controller.getLeaveTypes);
router.get("/:id", controller.getLeaveType);
router.put("/:id", controller.updateLeaveType);

export default router;
