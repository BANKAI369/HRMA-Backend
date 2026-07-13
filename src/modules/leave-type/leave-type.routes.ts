import { Router } from "express";
import { LeaveTypeController } from "./LeaveType.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorizePermissions } from "../../middleware/role.middleware";

const router = Router();

const controller = new LeaveTypeController();

router.post(
  "/",
  authenticate,
  authorizePermissions("leave_type.create"),
  controller.create.bind(controller)
);

router.get(
  "/",
  authenticate,
  authorizePermissions("leave_type.view"),
  controller.getAll.bind(controller)
);

router.get(
  "/:id",
  authenticate,
  authorizePermissions("leave_type.view"),
  controller.getById.bind(controller)
);

router.put(
  "/:id",
  authenticate,
  authorizePermissions("leave_type.update"),
  controller.update.bind(controller)
);

router.delete(
  "/:id",
  authenticate,
  authorizePermissions("leave_type.delete"),
  controller.delete.bind(controller)
);

export default router;
