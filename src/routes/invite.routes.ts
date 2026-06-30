import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  acceptInvite,
  createInvite,
  getInviteByToken,
  listInvites,
} from "../controllers/invite.controller";

const router = Router();

router.get("/", authenticate, listInvites);
router.post("/", authenticate, createInvite);
router.get("/:token", getInviteByToken);
router.post("/:token/accept", acceptInvite);

export default router;
