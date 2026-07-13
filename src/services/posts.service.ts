import { AppDataSource } from "../config/data-source";
import { Post } from "../entities/Posts";
import { CreatePostDto } from "../controllers/create-post.dto";

export class PostService {
    private repo = AppDataSource.getRepository(Post);
    async createPost(
        dto: CreatePostDto,
        authorId: string,
        tenantId: string,
        departmentId?: string | null
    ): Promise<Post> {
        const post = this.repo.create({
            ...dto,
            authorId,
            tenantId,
            departmentId: dto.scope === 'department' ? departmentId : null,
        });
        return await this.repo.save(post);
    }
  async create(dto: CreatePostDto, authorId: string, tenantId: string, departmentId?: string | null) {
    return this.createPost(dto, authorId, tenantId, departmentId);
  }
  async getFeed(tenantId: string, scope?: string, departmentId?: string | null) {
    const query = this.repo
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .where(`post.tenantId = :tenantId::uuid`, { tenantId });

    if (scope) {
      query.andWhere("post.scope = :scope", { scope });
      if (scope === "department" && departmentId) {
        query.andWhere("post.departmentId = :departmentId", { departmentId });
      }
    }

    return query.orderBy("post.createdAt", "DESC").getMany();
  }

  async getById(id: string) {
    return this.repo.findOne({
      where: { id },
    });
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }

  async toggleLike(id: string, userId: string): Promise<Post | null> {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) return null;
    
    const likes = post.likes || [];
    const index = likes.indexOf(userId);
    if (index > -1) likes.splice(index, 1);
    else likes.push(userId);
    
    return await this.repo.save({ ...post, likes });
  }

  async addComment(id: string, comment: { userId: string; username: string; content: string }): Promise<Post | null> {
    const post = await this.repo.findOne({ where: { id } });
    if (!post) return null;
    
    const comments = post.comments || [];
    comments.push({ ...comment, createdAt: new Date() });
    return await this.repo.save({ ...post, comments });
  }
}