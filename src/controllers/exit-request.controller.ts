import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { ExitRequestService } from "../services/exit-request.service";
import { Roles } from "../utils/roles.enum";
import { resolveRequestRole } from "../utils/role.utils";

const service = new ExitRequestService();

const nullableStringField = z
  .union([z.string().trim().min(1), z.literal(""), z.null()])
  .optional();

const createExitRequestSchema = z.object({
  employeeUserId: z.string().trim().min(1).optional(),
  exitReasonId: z.string().trim().min(1, "exitReasonId is required"),
  noticePeriodId: nullableStringField,
  lastWorkingDate: nullableStringField,
  remarks: nullableStringField,
});

const updateExitRequestSchema = z.object({
  exitReasonId: z.string().trim().min(1).optional(),
  noticePeriodId: nullableStringField,
  lastWorkingDate: nullableStringField,
  remarks: nullableStringField,
  status: z.string().trim().min(1).optional(),
});

const idParamSchema = z.object({
  id: z.string().trim().min(1, "Invalid id"),
});

export async function createExitRequest(req: AuthRequest, res: Response) {
  try {
    const parsed = createExitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requesterRole = resolveRequestRole(req);
    const targetEmployeeUserId = parsed.data.employeeUserId ?? req.user.id;

    if (
      requesterRole === Roles.Employee &&
      targetEmployeeUserId !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const exitRequest = await service.create({
      employeeUserId: targetEmployeeUserId,
      requestedByUserId: req.user.id,
      exitReasonId: parsed.data.exitReasonId,
      noticePeriodId: parsed.data.noticePeriodId,
      lastWorkingDate: parsed.data.lastWorkingDate,
      remarks: parsed.data.remarks,
    });

    res.status(201).json(exitRequest);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create exit request";
    res.status(400).json({ message });
  }
}

export async function updateExitRequest(req: AuthRequest, res: Response) {
  try {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: paramsParsed.error.flatten().fieldErrors,
      });
    }

    const bodyParsed = updateExitRequestSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: bodyParsed.error.flatten().fieldErrors,
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const existingRequest = await service.findOne(paramsParsed.data.id);
    const requesterRole = resolveRequestRole(req);

    if (
      requesterRole === Roles.Employee &&
      existingRequest.employeeUserId !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (requesterRole === Roles.Employee && bodyParsed.data.status !== undefined) {
      return res.status(403).json({
        message: "Employees cannot update exit request status",
      });
    }

    const updatedRequest = await service.update(
      paramsParsed.data.id,
      bodyParsed.data
    );

    res.json(updatedRequest);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update exit request";
    res.status(400).json({ message });
  }
}
