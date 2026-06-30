import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { PostService } from "../services/posts.service";
import { resolveRequestRole } from "../utils/role.utils";
import { Roles } from "../utils/roles.enum";

const postService = new PostService();

export class PostsController {
  async create(req: AuthRequest, res: Response) {
    const user = req.user as any;
    const result = await postService.create(
      req.body,
      user.id,
      user.tenantId,
      user.departmentId
    );
    return res.status(201).json(result);
  }

  async feed(req: AuthRequest, res: Response) {
    const user = req.user as any;
    const { scope } = req.query;
    const posts = await postService.getFeed(user.tenantId, scope as string, user.departmentId);
    return res.json(posts);
  }

  async getById(req: AuthRequest, res: Response) {
    const post = await postService.getById(req.params.id);
    return res.json(post);
  }

  async delete(req: AuthRequest, res: Response) {
    const role = resolveRequestRole(req);
    if (role !== Roles.Admin && role !== Roles.SuperAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await postService.delete(req.params.id);
    return res.status(204).send();
  }

  async toggleLike(req: AuthRequest, res: Response) {
    const user = req.user as any; // Assuming user is authenticated and req.user contains user info
    const postId = req.params.id;
    const updatedPost = await postService.toggleLike(postId, user.id);
    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.json(updatedPost);
  }

  async addComment(req: AuthRequest, res: Response) {
    const user = req.user as any; // Assuming user is authenticated and req.user contains user info
    const postId = req.params.id;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }
    const comment = { userId: user.id, username: user.username, content };
    const updatedPost = await postService.addComment(postId, comment);
    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(201).json(updatedPost);
  }
}
