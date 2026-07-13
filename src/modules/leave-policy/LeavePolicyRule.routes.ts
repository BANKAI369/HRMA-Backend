import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorizePermissions } from "../../middleware/role.middleware";
import { LeavePolicyRuleController } from "./LeavePolicyRule.controller";

const router = Router();

const controller =
  new LeavePolicyRuleController();


router.get(
  "/leave-policies/:policyId/rules",
  authenticate,
  authorizePermissions(
    "leave_policy_rule.view"
  ),
  controller.getRules.bind(controller)
);

router.get(
  "/leave-policy-rules/:id",
  authenticate,
  authorizePermissions(
    "leave_policy_rule.view"
  ),
  controller.getRule.bind(controller)
);

router.put(
  "/leave-policy-rules/:id",
  authenticate,
  authorizePermissions(
    "leave_policy_rule.update"
  ),
  controller.updateRule.bind(controller)
);

router.delete(
  "/leave-policy-rules/:id",
  authenticate,
  authorizePermissions(
    "leave_policy_rule.delete"
  ),
  controller.deleteRule.bind(controller)
);

export default router;
