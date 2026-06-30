import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  authorizePermissions,
} from "../../middleware/role.middleware";

import { PolicyAssignmentController } from "./PolicyAssignment.controller";

const router = Router();

const controller =
  new PolicyAssignmentController();

router.post(
  "/",
  authenticate,
  authorizePermissions(
    "policy_assignment.create"
  ),
  controller.create.bind(controller)
);

router.get(
  "/",
  authenticate,
  authorizePermissions(
    "policy_assignment.view"
  ),
  controller.getAll.bind(controller)
);

router.get(
  "/:id",
  authenticate,
  authorizePermissions(
    "policy_assignment.view"
  ),
  controller.getById.bind(controller)
);

router.put(
  "/:id",
  authenticate,
  authorizePermissions(
    "policy_assignment.update"
  ),
  controller.update.bind(controller)
);

router.delete(
  "/:id",
  authenticate,
  authorizePermissions(
    "policy_assignment.delete"
  ),
  controller.delete.bind(controller)
);

export default router;
