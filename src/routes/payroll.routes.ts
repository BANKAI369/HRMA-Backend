import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import * as controller from "../controllers/payroll.controller";

const router = Router();

router.use(authenticate, authorizeRoles("Admin", "Manager", "Employee"));

router.get("/salary-components", controller.getSalaryComponents);
router.get("/pay-groups", controller.getPayGroups);
router.get("/pay-cycles", controller.getPayCycles);
router.get("/pay-register", controller.getPayRegister);
router.get("/pay-batches", controller.getPayBatches);
router.get("/batch-payments", controller.getBatchPayments);
router.put("/batch-payments/:paymentId/status", controller.updatePaymentStatus);
router.get("/pay-grades", controller.getPayGrades);
router.get("/pay-bands", controller.getPayBands);
router.get("/employee-salaries", controller.getEmployeeSalaries);
router.get("/employee-fnf", controller.getEmployeeFnfDetails);
router.get("/bonus-types", controller.getBonusTypes);

export default router;

