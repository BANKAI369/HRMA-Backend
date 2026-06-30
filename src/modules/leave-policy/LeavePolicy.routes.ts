import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  authorizePermissions,
} from "../../middleware/role.middleware";

import { LeavePolicyController } from "./LeavePolicy.controller";

const router = Router();

const controller =
  new LeavePolicyController();

router.post(
  "/",
  authenticate,
  authorizePermissions(
    "leave_policy.create"
  ),
  controller.create.bind(controller)
);

router.get(
  "/",
  authenticate,
  authorizePermissions(
    "leave_policy.view"
  ),
  controller.getAll.bind(controller)
);

router.get(
  "/:id",
  authenticate,
  authorizePermissions(
    "leave_policy.view"
  ),
  controller.getById.bind(controller)
);

router.put(
  "/:id",
  authenticate,
  authorizePermissions(
    "leave_policy.update"
  ),
  controller.update.bind(controller)
);

router.delete(
  "/:id",
  authenticate,
  authorizePermissions(
    "leave_policy.delete"
  ),
  controller.delete.bind(controller)
);

router.post(
  "/:policyId/rules",
  authenticate,
  authorizePermissions(
    "leave_policy_rule.create"
  ),
  controller.addRule.bind(controller)
);

export default router;
