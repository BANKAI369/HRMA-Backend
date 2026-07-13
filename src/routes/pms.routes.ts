import { Router } from "express";
import { PmsController } from "../controllers/pms.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const controller = new PmsController();

router.use(authenticate);

router.get("/goals", (req, res) => controller.getGoals(req, res));
router.get("/timeframes", (req, res) => controller.getTimeFrames(req, res));
router.put("/goals/:id/progress", (req, res) => controller.updateGoalProgress(req, res));
router.get("/badges", (req, res) => controller.getBadges(req, res));
router.get("/praises", (req, res) => controller.getPraises(req, res));
router.post("/praises", (req, res) => controller.createPraise(req, res));

export default router;