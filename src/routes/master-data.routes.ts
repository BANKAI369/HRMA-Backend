import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import * as controller from "../controllers/master-data.controller";

const router = Router();

router.use(authenticate, authorizeRoles("Admin", "Manager", "Employee"));

router.get("/", controller.getMasterData);
router.get("/departments", controller.getDepartments);
router.get("/locations", controller.getLocations);
router.get("/job-titles", controller.getJobTitles);
router.get("/currencies", controller.getCurrencies);
router.get("/notice-periods", controller.getNoticePeriods);
router.get("/exit-reasons", controller.getExitReasons);
router.get("/groups", controller.getGroups);
router.get("/group-types", controller.getGroupTypes);

export default router;
