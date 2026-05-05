import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as controller from "../controllers/leave.controller";

const router = Router();

router.use(authenticate);

router.post("/", controller.createLeaveRequest);
router.get("/", controller.getLeaveRequests);
router.get("/balances", controller.getLeaveBalances);
router.get("/plans", controller.getLeavePlans);
router.get("/my", controller.getMyLeaveRequests);
router.get("/:id", controller.getLeaveRequest);
router.put("/:id", controller.updateLeaveRequest);
router.patch("/:id/review", controller.reviewLeaveRequest);
router.patch("/:id/cancel", controller.cancelLeaveRequest);

export default router;
