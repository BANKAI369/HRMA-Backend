import { Request, Response } from "express";
import { LeaveTypeService } from "./LeaveType.service";

const service = new LeaveTypeService();

export class LeaveTypeController {
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const result = await service.create(
        req.body,
        user.tenantId
      );

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async getAll(req: Request, res: Response) {
    const user = (req as any).user;

    const result = await service.getAll(
      user.tenantId
    );

    return res.json(result);
  }

  async getById(req: Request, res: Response) {
    const result = await service.getById(
      req.params.id
    );

    return res.json(result);
  }

  async update(req: Request, res: Response) {
    const result = await service.update(
      req.params.id,
      req.body
    );

    return res.json(result);
  }

  async delete(req: Request, res: Response) {
    await service.deactivate(req.params.id);

    return res.status(204).send();
  }
}
