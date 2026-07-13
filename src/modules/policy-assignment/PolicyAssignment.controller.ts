import { Response } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";

import { PolicyAssignmentService } from "./policy_assignment.service";

const service =
  new PolicyAssignmentService();

export class PolicyAssignmentController {
  async create(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const result =
        await service.create(
          req.body,
          req.user.tenantId
        );

      return res.status(201).json(
        result
      );
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
      await service.getAll(
        req.user.tenantId
      );

    return res.json(result);
  }

  async getById(
    req: AuthRequest,
    res: Response
  ) {
    const result =
      await service.getById(
        req.params.id
      );

    return res.json(result);
  }

  async update(
    req: AuthRequest,
    res: Response
  ) {
    const result =
      await service.update(
        req.params.id,
        req.body
      );

    return res.json(result);
  }

  async delete(
    req: AuthRequest,
    res: Response
  ) {
    await service.delete(
      req.params.id
    );

    return res.status(204).send();
  }
}
