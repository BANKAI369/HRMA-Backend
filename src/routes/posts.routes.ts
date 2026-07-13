import { Router } from "express";
import { PostsController } from "../controllers/posts.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const postsController = new PostsController();

// Public routes (if any, though usually posts require auth)
// router.get("/:id", postsController.getById); // Example of a public route

// Authenticated routes
router.post("/", authenticate, postsController.create);
router.get("/feed", authenticate, postsController.feed);
router.get("/:id", authenticate, postsController.getById); // Assuming getById also requires auth
router.delete("/:id", authenticate, postsController.delete);
router.post("/:id/like", authenticate, postsController.toggleLike);
router.post("/:id/comment", authenticate, postsController.addComment);

export default router;