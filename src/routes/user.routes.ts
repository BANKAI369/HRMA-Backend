import { Router } from "express";
import { getUsers } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const router = Router();

router.get("/", authenticate, authorize("admin"), getUsers);

export default router;
