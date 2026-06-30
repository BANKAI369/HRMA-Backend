import { AppDataSource } from "../../config/data-source";

import { LeavePolicy } from "../../entities/LeavePolicies";
import { LeavePolicyRule } from "../../entities/LeavePolicyRules";

import { CreatePolicyDto } from "./dto/create-policy.dto";
import { CreatePolicyRuleDto } from "./dto/create-policy-rule.dto";

export class LeavePolicyService {
  private policyRepo =
    AppDataSource.getRepository(LeavePolicy);

  private ruleRepo =
    AppDataSource.getRepository(LeavePolicyRule);

  async createPolicy(
    dto: CreatePolicyDto,
    tenantId: string,
    createdBy: string
  ) {
    const policy = this.policyRepo.create({
      ...dto,
      tenantId,
      createdBy,
    });

    return this.policyRepo.save(policy);
  }

  async getPolicies(tenantId: string) {
    return this.policyRepo.find({
      where: {
        tenantId,
        isActive: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async getPolicy(id: string) {
    const policy = await this.policyRepo.findOne({
      where: { id },
    });

    if (!policy) {
      throw new Error("Policy not found");
    }

    const rules = await this.ruleRepo.find({
      where: {
        policyId: id,
      },
    });

    return {
      ...policy,
      rules,
    };
  }

  async addRule(
    policyId: string,
    dto: CreatePolicyRuleDto
  ) {
    const existingRule =
      await this.ruleRepo.findOne({
        where: {
          policyId,
          leaveTypeId: dto.leaveTypeId,
        },
      });

    if (existingRule) {
      throw new Error(
        "Leave type already exists in policy"
      );
    }

    const rule = this.ruleRepo.create({
      ...dto,
      policyId,
    });

    return this.ruleRepo.save(rule);
  }

  async updatePolicy(
    id: string,
    payload: Partial<LeavePolicy>
  ) {
    await this.policyRepo.update(id, payload);

    return this.getPolicy(id);
  }

  async deletePolicy(id: string) {
    await this.policyRepo.update(id, {
      isActive: false,
    });
  }
}
