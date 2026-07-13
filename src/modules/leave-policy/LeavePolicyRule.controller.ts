import { Request, Response } from "express";
import { LeavePolicyRuleService } from "./LeavePlocyRule.service";

export class LeavePolicyRuleController {
  private service =
    new LeavePolicyRuleService();

  async getRules(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.getRules(
        req.params.policyId
      );

    return res.json(result);
  }

  async getRule(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.getRule(
        req.params.id
      );

    return res.json(result);
  }

  async updateRule(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.updateRule(
        req.params.id,
        req.body
      );

    return res.json(result);
  }

  async deleteRule(
    req: Request,
    res: Response
  ) {
    await this.service.deleteRule(
      req.params.id
    );

    return res.status(204).send();
  }
}
