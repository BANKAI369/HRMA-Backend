import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  canAccessLeaveRequest,
  canAccessUserLeaves,
  canReviewLeaveRequest,
  getAccessibleLeaveUserIds,
  hasLeaveAdminAccess,
} from "../services/leave-access.service";
import { LeaveService } from "../services/leave.service";
import { resolveAuthenticatedUser } from "../utils/auth-user.utils";
import { LeaveStatus } from "../utils/leave-status.enum";

const service = new LeaveService();

const idParamSchema = z.object({
  id: z.string().uuid("Invalid id"),
});

const nullableTextField = z
  .union([z.string().trim(), z.literal(""), z.null()])
  .optional();

const leaveTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: nullableTextField,
  annualAllowanceDays: z.number().int().min(0).optional(),
  isPaid: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const updateLeaveTypeSchema = leaveTypeSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

const createLeaveRequestSchema = z.object({
  userId: z.string().uuid("Valid userId is required").optional(),
  leaveTypeId: z.string().uuid("Valid leaveTypeId is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  reason: nullableTextField,
});

const updateLeaveRequestSchema = z
  .object({
    userId: z.string().uuid("Valid userId is required").optional(),
    leaveTypeId: z.string().uuid("Valid leaveTypeId is required").optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
    reason: nullableTextField,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const listLeaveRequestsQuerySchema = z.object({
  userId: z.string().uuid("Valid userId is required").optional(),
  status: z.nativeEnum(LeaveStatus).optional(),
  leaveTypeId: z.string().uuid("Valid leaveTypeId is required").optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const reviewLeaveRequestSchema = z
  .object({
    status: z.nativeEnum(LeaveStatus),
    reviewRemarks: nullableTextField,
  })
  .refine(
    (data) =>
      data.status === LeaveStatus.APPROVED ||
      data.status === LeaveStatus.REJECTED,
    {
      message: "status must be Approved or Rejected",
      path: ["status"],
    }
  );

const cancelLeaveRequestSchema = z.object({
  reviewRemarks: nullableTextField,
});

const listLeaveBalancesQuerySchema = z.object({
  userId: z.string().uuid("Valid userId is required").optional(),
  year: z.coerce.number().int().min(2000).max(3000).optional(),
});

const parseListLeaveRequestsQuery = (query: AuthRequest["query"]) => {
  const parsed = listLeaveRequestsQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw Object.assign(new Error("Invalid query"), {
      statusCode: 400,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
};

const resolveLeaveActor = (req: AuthRequest) =>
  resolveAuthenticatedUser(req, ["role", "department"]);

const parseListLeaveBalancesQuery = (query: AuthRequest["query"]) => {
  const parsed = listLeaveBalancesQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw Object.assign(new Error("Invalid query"), {
      statusCode: 400,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
};

export const createLeaveType = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    if (!hasLeaveAdminAccess(actor)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const parsed = leaveTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const leaveType = await service.createLeaveType(parsed.data, {
      actorUserId: actor?.id ?? null,
    });

    return res.status(201).json(leaveType);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create leave type";
    return res.status(400).json({ message });
  }
};

export const getLeaveTypes = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    const includeInactive =
      hasLeaveAdminAccess(actor) && req.query.includeInactive === "true";

    return res.status(200).json(await service.listLeaveTypes(includeInactive));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch leave types";
    return res.status(500).json({ message });
  }
};

export const getLeavePlans = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listLeavePlans());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch leave plans";
    return res.status(500).json({ message });
  }
};

export const getLeaveType = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return res.status(200).json(await service.getLeaveType(parsed.data.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Leave type not found";
    return res.status(message === "Leave type not found" ? 404 : 500).json({
      message,
    });
  }
};

export const updateLeaveType = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    if (!hasLeaveAdminAccess(actor)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const paramsParsed = idParamSchema.safeParse(req.params);
    const bodyParsed = updateLeaveTypeSchema.safeParse(req.body);
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

    const leaveType = await service.updateLeaveType(
      paramsParsed.data.id,
      bodyParsed.data,
      { actorUserId: actor?.id ?? null }
    );

    return res.status(200).json(leaveType);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update leave type";
    return res.status(400).json({ message });
  }
};

export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = createLeaveRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const targetUserId = parsed.data.userId ?? actor.id;
    const canCreate = await canAccessUserLeaves(actor, targetUserId);
    if (!canCreate) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const leaveRequest = await service.createLeaveRequest(
      {
        userId: targetUserId,
        leaveTypeId: parsed.data.leaveTypeId,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        reason: parsed.data.reason,
      },
      { actorUserId: actor.id }
    );

    return res.status(201).json(leaveRequest);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create leave request";
    return res.status(400).json({ message });
  }
};

export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    const parsedQuery = parseListLeaveRequestsQuery(req.query);

    if (parsedQuery.userId) {
      const canViewUser = await canAccessUserLeaves(actor, parsedQuery.userId);
      if (!canViewUser) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const accessibleUserIds = await getAccessibleLeaveUserIds(actor);
    const result = await service.listLeaveRequests({
      ...parsedQuery,
      accessibleUserIds,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({
      message: error?.message ?? "Failed to fetch leave requests",
      ...(error?.errors ? { errors: error.errors } : {}),
    });
  }
};

export const getLeaveBalances = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsedQuery = parseListLeaveBalancesQuery(req.query);
    const targetUserId = parsedQuery.userId ?? actor.id;
    const canViewUser = await canAccessUserLeaves(actor, targetUserId);

    if (!canViewUser) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await service.listLeaveBalances({
      userId: targetUserId,
      year: parsedQuery.year ?? new Date().getUTCFullYear(),
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({
      message: error?.message ?? "Failed to fetch leave balances",
      ...(error?.errors ? { errors: error.errors } : {}),
    });
  }
};

export const getMyLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsedQuery = parseListLeaveRequestsQuery(req.query);
    const result = await service.listLeaveRequests({
      ...parsedQuery,
      userId: actor.id,
      accessibleUserIds: [actor.id],
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({
      message: error?.message ?? "Failed to fetch leave requests",
      ...(error?.errors ? { errors: error.errors } : {}),
    });
  }
};

export const getLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: paramsParsed.error.flatten().fieldErrors,
      });
    }

    const leaveRequestEntity = await service.getLeaveRequestEntity(
      paramsParsed.data.id
    );
    const canView = await canAccessLeaveRequest(actor, leaveRequestEntity);
    if (!canView) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(await service.getLeaveRequest(paramsParsed.data.id));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch leave request";
    return res.status(message === "Leave request not found" ? 404 : 500).json({
      message,
    });
  }
};

export const updateLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const paramsParsed = idParamSchema.safeParse(req.params);
    const bodyParsed = updateLeaveRequestSchema.safeParse(req.body);
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

    const leaveRequestEntity = await service.getLeaveRequestEntity(
      paramsParsed.data.id
    );
    const canUpdate = await canAccessLeaveRequest(actor, leaveRequestEntity);
    if (!canUpdate) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (bodyParsed.data.userId && bodyParsed.data.userId !== leaveRequestEntity.userId) {
      const canMoveRequest = await canAccessUserLeaves(actor, bodyParsed.data.userId);
      if (!hasLeaveAdminAccess(actor) || !canMoveRequest) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const leaveRequest = await service.updatePendingLeaveRequest(
      paramsParsed.data.id,
      bodyParsed.data,
      { actorUserId: actor.id }
    );

    return res.status(200).json(leaveRequest);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update leave request";
    return res.status(400).json({ message });
  }
};

export const reviewLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const paramsParsed = idParamSchema.safeParse(req.params);
    const bodyParsed = reviewLeaveRequestSchema.safeParse(req.body);
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

    const leaveRequestEntity = await service.getLeaveRequestEntity(
      paramsParsed.data.id
    );
    const canReview = await canReviewLeaveRequest(actor, leaveRequestEntity);
    if (!canReview) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const leaveRequest = await service.reviewLeaveRequest(
      paramsParsed.data.id,
      actor.id,
      bodyParsed.data.status as LeaveStatus.APPROVED | LeaveStatus.REJECTED,
      bodyParsed.data.reviewRemarks
    );

    return res.status(200).json({
      message: "Leave request reviewed successfully",
      data: leaveRequest,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to review leave request";
    return res.status(400).json({ message });
  }
};

export const cancelLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const actor = await resolveLeaveActor(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const paramsParsed = idParamSchema.safeParse(req.params);
    const bodyParsed = cancelLeaveRequestSchema.safeParse(req.body ?? {});
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

    const leaveRequestEntity = await service.getLeaveRequestEntity(
      paramsParsed.data.id
    );
    const canCancel = await canAccessLeaveRequest(actor, leaveRequestEntity);
    if (!canCancel) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const leaveRequest = await service.cancelLeaveRequest(
      paramsParsed.data.id,
      actor.id,
      bodyParsed.data.reviewRemarks
    );

    return res.status(200).json(leaveRequest);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel leave request";
    return res.status(400).json({ message });
  }
};
