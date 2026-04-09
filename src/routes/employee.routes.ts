import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createEmployee,
  getEmployee,
  getEmployees,
  updateEmployeeJobDetails,
  updateEmployeePersonalDetails,
} from "../controllers/employee.controller";

const router = Router();

router.use(authenticate);
router.get("/", getEmployees);
router.post("/", createEmployee);
router.put("/:id/personal-details", updateEmployeePersonalDetails);
router.put("/:id/job-details", updateEmployeeJobDetails);
router.get("/:id", getEmployee);

export default router;
