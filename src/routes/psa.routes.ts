import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import * as controller from "../controllers/psa.controller";


const router = Router();

router.use(authenticate, authorizeRoles("Admin", "Manager", "Employee"));

router.get("/clients", controller.getClients);
router.post("/clients", authorizeRoles("Admin", "Manager"), controller.createClient);
router.get("/clients/:id", controller.getClient);
router.put("/clients/:id", authorizeRoles("Admin", "Manager"), controller.updateClient);

router.get("/billing-roles", controller.getBillingRoles);

router.get("/project-phases", controller.getProjectPhases);
router.post(
  "/project-phases",
  authorizeRoles("Admin", "Manager"),
  controller.createProjectPhase
);

router.get("/projects", controller.getProjects);
router.post("/projects", authorizeRoles("Admin", "Manager"), controller.createProject);
router.get("/projects/:id", controller.getProject);
router.put("/projects/:id", authorizeRoles("Admin", "Manager"), controller.updateProject);

// Allocation
router.get("/allocations", controller.getAllocations);
router.post("/allocations", controller.createAllocation);

// Tasks
router.get("/projects/:projectId/tasks", controller.getTasks);
router.post("/tasks", controller.createTask);
router.put("/tasks/:id", controller.updateTask);

router.get("/projects/:projectId/assignees", controller.getTaskAssignees);

// Timesheets
router.get("/timesheets", controller.getTimesheets);
router.get("/projects/:projectId/timesheets", controller.getProjectTimesheets);
router.get("/tasks/:taskId/timesheets", controller.getTaskTimesheets);

export default router;
