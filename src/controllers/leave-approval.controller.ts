import { Response } from "express";
import { z } from "zod";

import { LeaveApprovalService } from "../services/leave-approval.service";
import { resolveAuthenticatedUser } from "../utils/auth-user.utils";
import { LeaveStatus } from "../utils/leave-status.enum";
import { AuthRequest } from "../middleware/auth.middleware";

const service = new LeaveApprovalService();

const idParamSchema = z.object({
  id: z.string().uuid("Invalid id"),
});

const reviewLeaveRequestSchema = z
  .object({
    status: z.enum([LeaveStatus.APPROVED, LeaveStatus.REJECTED]),
    reviewRemarks: z.union([z.string().trim(), z.literal(""), z.null()]).optional(),
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

const commentSchema = z.object({
  reviewRemarks: z.union([z.string().trim(), z.literal(""), z.null()]).optional(),
});

export class LeaveApprovalController {
  private async resolveActor(req: AuthRequest) {
    const actor = await resolveAuthenticatedUser(req, ["role", "department"]);

    if (!actor) {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    }

    return actor;
  }

  async reviewLeaveRequest(req: AuthRequest, res: Response) {
    try {
      const actor = await this.resolveActor(req);
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

      const leaveRequest = await service.reviewLeaveRequest({
        leaveRequestId: paramsParsed.data.id,
        actor,
        status: bodyParsed.data.status as LeaveStatus.APPROVED | LeaveStatus.REJECTED,
        reviewRemarks: bodyParsed.data.reviewRemarks,
      });

      return res.status(200).json({
        message: "Leave request reviewed successfully",
        data: leaveRequest,
      });
    } catch (error: any) {
      return res.status(error?.statusCode ?? 400).json({
        message: error?.message ?? "Failed to review leave request",
      });
    }
  }

  async approveLeaveRequest(req: AuthRequest, res: Response) {
    try {
      const actor = await this.resolveActor(req);
      const paramsParsed = idParamSchema.safeParse(req.params);
      const bodyParsed = commentSchema.safeParse(req.body ?? {});

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

      const leaveRequest = await service.approveLeaveRequest({
        leaveRequestId: paramsParsed.data.id,
        actor,
        reviewRemarks: bodyParsed.data.reviewRemarks,
      });

      return res.status(200).json(leaveRequest);
    } catch (error: any) {
      return res.status(error?.statusCode ?? 400).json({
        message: error?.message ?? "Failed to approve leave request",
      });
    }
  }

  async rejectLeaveRequest(req: AuthRequest, res: Response) {
    try {
      const actor = await this.resolveActor(req);
      const paramsParsed = idParamSchema.safeParse(req.params);
      const bodyParsed = commentSchema.safeParse(req.body ?? {});

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

      const leaveRequest = await service.rejectLeaveRequest({
        leaveRequestId: paramsParsed.data.id,
        actor,
        reviewRemarks: bodyParsed.data.reviewRemarks,
      });

      return res.status(200).json(leaveRequest);
    } catch (error: any) {
      return res.status(error?.statusCode ?? 400).json({
        message: error?.message ?? "Failed to reject leave request",
      });
    }
  }

  async cancelLeaveRequest(req: AuthRequest, res: Response) {
    try {
      const actor = await this.resolveActor(req);
      const paramsParsed = idParamSchema.safeParse(req.params);
      const bodyParsed = commentSchema.safeParse(req.body ?? {});

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

      const leaveRequest = await service.cancelLeaveRequest({
        leaveRequestId: paramsParsed.data.id,
        actor,
        reviewRemarks: bodyParsed.data.reviewRemarks,
      });

      return res.status(200).json(leaveRequest);
    } catch (error: any) {
      return res.status(error?.statusCode ?? 400).json({
        message: error?.message ?? "Failed to cancel leave request",
      });
    }
  }
}
