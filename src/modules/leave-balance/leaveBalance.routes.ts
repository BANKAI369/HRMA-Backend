import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  authorizePermissions,
} from "../../middleware/role.middleware";

import { LeaveBalanceController } from "./LeaveBalance.controller";

const router = Router();

const controller =
  new LeaveBalanceController();

router.post(
  "/generate",
  authenticate,
  authorizePermissions(
    "leave_balance.generate"
  ),
  controller.generate.bind(
    controller
  )
);

router.get(
  "/me",
  authenticate,
  authorizePermissions(
    "leave_balance.view"
  ),
  controller.getMyBalances.bind(
    controller
  )
);

router.get(
  "/employee/:employeeId",
  authenticate,
  authorizePermissions(
    "leave_balance.view"
  ),
  controller.getEmployeeBalances.bind(
    controller
  )
);

router.put(
  "/:id",
  authenticate,
  authorizePermissions(
    "leave_balance.update"
  ),
  controller.update.bind(
    controller
  )
);

export default router;
