import { AppDataSource } from "../config/data-source";
import { TimeFrame } from "../entities/TimeFrame";
import { Goal } from "../entities/Goal";
import { Badge } from "../entities/Badge";
import { Praise } from "../entities/Praise";

export class PmsService {
  private timeFrameRepo = AppDataSource.getRepository(TimeFrame);
  private goalRepo = AppDataSource.getRepository(Goal);
  private badgeRepo = AppDataSource.getRepository(Badge);
  private praiseRepo = AppDataSource.getRepository(Praise);

  // Time Frames
  async getTimeFrames() {
    return this.timeFrameRepo.find({
      order: { createdAt: "DESC" },
    });
  }

  // Goals
  async getGoals() {
    return this.goalRepo.find({
      relations: ["user", "timeFrame"],
    });
  }

  async updateGoalProgress(goalId: string, progress: number) {
    const goal = await this.goalRepo.findOne({ where: { id: goalId } });

    if (!goal) throw new Error("Goal not found");

    goal.progress = progress;
    return this.goalRepo.save(goal);
  }

  // Badges
  async getBadges() {
    return this.badgeRepo.find();
  }

  // Praise
  async getPraises() {
    return this.praiseRepo.find({
      relations: ["fromUser", "toUser", "badge"],
      order: { createdAt: "DESC" },
    });
  }

  async createPraise(data: {
    message: string;
    fromUserId: string;
    toUserId: string;
    badgeId?: string;
  }) {
    const praise = this.praiseRepo.create(data);
    return this.praiseRepo.save(praise);
  }
}