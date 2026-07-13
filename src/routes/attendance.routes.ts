import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import * as controller from "../controllers/attendance.controller";

const router = Router();

router.use(authenticate, authorizeRoles("Admin", "Manager", "Employee"));

router.get("/", controller.getAttendanceRecords);
router.post("/punches", controller.createAttendancePunches);
router.get("/capture-schemes", controller.getCaptureSchemes);
router.get("/shift-policies", controller.getShiftPolicies);
router.get("/holiday-calendars", controller.getHolidayCalendars);
router.get("/tracking-policies", controller.getTrackingPolicies);
router.get("/weekly-off-policies", controller.getWeeklyOffPolicies);

export default router;
