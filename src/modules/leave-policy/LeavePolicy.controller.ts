import { Response } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";

import { LeavePolicyService } from "./LeavePolicy.service";

const service = new LeavePolicyService();

export class LeavePolicyController {
  async create(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const result =
        await service.createPolicy(
          req.body,
          req.user.tenantId,
          req.user.id
        );

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async getAll(
    req: AuthRequest,
    res: Response
  ) {
    const result =
      await service.getPolicies(
        req.user.tenantId
      );

    return res.json(result);
  }

  async getById(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const result =
        await service.getPolicy(
          req.params.id
        );

      return res.json(result);
    } catch (error: any) {
      return res.status(404).json({
        message: error.message,
      });
    }
  }

  async addRule(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const result =
        await service.addRule(
          req.params.policyId,
          req.body
        );

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async update(
    req: AuthRequest,
    res: Response
  ) {
    const result =
      await service.updatePolicy(
        req.params.id,
        req.body
      );

    return res.json(result);
  }

  async delete(
    req: AuthRequest,
    res: Response
  ) {
    await service.deletePolicy(
      req.params.id
    );

    return res.status(204).send();
  }
}
