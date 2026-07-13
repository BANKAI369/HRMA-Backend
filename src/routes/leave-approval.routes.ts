import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { LeaveApprovalController } from "../controllers/leave-approval.controller";

const router = Router();
const controller = new LeaveApprovalController();

router.use(authenticate);

router.patch("/:id/review", controller.reviewLeaveRequest.bind(controller));
router.put("/:id/approve", controller.approveLeaveRequest.bind(controller));
router.patch("/:id/reject", controller.rejectLeaveRequest.bind(controller));
router.patch("/:id/cancel", controller.cancelLeaveRequest.bind(controller));

export default router;
