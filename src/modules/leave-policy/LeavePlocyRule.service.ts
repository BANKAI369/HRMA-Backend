import { AppDataSource } from "../../config/data-source";
import { LeavePolicyRule } from "../../entities/LeavePolicyRules";


export class LeavePolicyRuleService {
  private repo =
    AppDataSource.getRepository(
      LeavePolicyRule
    );

  async getRules(policyId: string) {
    return this.repo.find({
      where: { policyId },
    });
  }

  async getRule(id: string) {
    return this.repo.findOne({
      where: { id },
    });
  }

  async updateRule(
    id: string,
    payload: Partial<LeavePolicyRule>
  ) {
    await this.repo.update(id, payload);

    return this.getRule(id);
  }

  async deleteRule(id: string) {
    await this.repo.delete(id);
  }
}
