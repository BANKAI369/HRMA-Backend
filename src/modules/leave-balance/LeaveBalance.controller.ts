import { Response } from "express";
import { z } from "zod";

import { AppDataSource } from "../../config/data-source";
import { User } from "../../entities/User";
import { AuthRequest } from "../../middleware/auth.middleware";
import { canAccessUserLeaves } from "../leave-request/leave-access.service";
import { resolveAuthenticatedUser } from "../../utils/auth-user.utils";

import {
  LeaveBalanceService,
  LeaveBalanceUpdateInput,
} from "./leaveBalance.service";

const service = new LeaveBalanceService();
const userRepo = AppDataSource.getRepository(User);

const uuidSchema = z.string().uuid("Invalid id");

const generateSchema = z.object({
  employeeId: uuidSchema,
  policyId: uuidSchema,
  year: z.coerce.number().int().min(2000).max(3000).optional(),
});

const updateBalanceSchema = z
  .object({
    allocated: z.coerce.number().min(0).optional(),
    used: z.coerce.number().min(0).optional(),
    pending: z.coerce.number().min(0).optional(),
    remaining: z.coerce.number().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const employeeParamSchema = z.object({
  employeeId: uuidSchema,
});

const balanceIdSchema = z.object({
  id: uuidSchema,
});

const resolveBalanceActor = (req: AuthRequest) =>
  resolveAuthenticatedUser(req, ["role", "department"]);

const loadUserById = async (id: string) =>
  userRepo.findOne({
    where: { id },
  });

const ensureSameTenant = (actorTenantId: string | null, targetTenantId: string | null) =>
  Boolean(actorTenantId && targetTenantId && actorTenantId === targetTenantId);

export class LeaveBalanceController {
  async generate(req: AuthRequest, res: Response) {
    try {
      const actor = await resolveBalanceActor(req);
      if (!actor) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!actor.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const parsedBody = generateSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: parsedBody.error.flatten().fieldErrors,
        });
      }

      const targetUser = await loadUserById(parsedBody.data.employeeId);
      if (!targetUser || !ensureSameTenant(actor.tenantId, targetUser.tenantId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!(await canAccessUserLeaves(actor, targetUser.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const result = await service.generateBalance(
        actor.tenantId,
        targetUser.id,
        parsedBody.data.policyId,
        parsedBody.data.year
      );

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async getMyBalances(req: AuthRequest, res: Response) {
    try {
      const actor = await resolveBalanceActor(req);
      if (!actor) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await service.getEmployeeBalances(
        actor.id,
        actor.tenantId ?? undefined
      );

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async getEmployeeBalances(req: AuthRequest, res: Response) {
    try {
      const actor = await resolveBalanceActor(req);
      if (!actor) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const paramsParsed = employeeParamSchema.safeParse(req.params);
      if (!paramsParsed.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: paramsParsed.error.flatten().fieldErrors,
        });
      }

      const targetUser = await loadUserById(paramsParsed.data.employeeId);
      if (!targetUser || !ensureSameTenant(actor.tenantId, targetUser.tenantId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!(await canAccessUserLeaves(actor, targetUser.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const result = await service.getEmployeeBalances(
        targetUser.id,
        targetUser.tenantId ?? undefined
      );

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const actor = await resolveBalanceActor(req);
      if (!actor) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const paramsParsed = balanceIdSchema.safeParse(req.params);
      const bodyParsed = updateBalanceSchema.safeParse(req.body);
      if (!paramsParsed.success || !bodyParsed.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: {
            ...(!paramsParsed.success
              ? paramsParsed.error.flatten().fieldErrors
              : {}),
            ...(!bodyParsed.success ? bodyParsed.error.flatten().fieldErrors : {}),
          },
        });
      }

      const balance = await service.getBalance(
        paramsParsed.data.id,
        actor.tenantId ?? undefined
      );

      if (!balance) {
        return res.status(404).json({ message: "Balance not found" });
      }

      const targetUser = await loadUserById(balance.employeeId);
      if (!targetUser || !ensureSameTenant(actor.tenantId, targetUser.tenantId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!(await canAccessUserLeaves(actor, targetUser.id))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = bodyParsed.data as LeaveBalanceUpdateInput;
      const result = await service.updateBalance(
        balance.id,
        payload,
        actor.tenantId ?? undefined
      );

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({
        message: error.message,
      });
    }
  }
}
