import { User } from "../entities/User";
import { LeaveService } from "../modules/leave-request/leave.service";
import {
  canAccessLeaveRequest,
  canReviewLeaveRequest,
} from "../modules/leave-request/leave-access.service";
import { LeaveStatus } from "../utils/leave-status.enum";

type LeaveApprovalInput = {
  leaveRequestId: string;
  actor: User | null;
  reviewRemarks?: string | null;
};

type ReviewLeaveRequestInput = LeaveApprovalInput & {
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
};

export class LeaveApprovalService {
  private readonly leaveService = new LeaveService();

  private requireActor(actor: User | null) {
    if (!actor || !actor.isActive) {
      throw new Error("Unauthorized");
    }

    return actor;
  }

  async reviewLeaveRequest(input: ReviewLeaveRequestInput) {
    const actor = this.requireActor(input.actor);

    const leaveRequest = await this.leaveService.getLeaveRequestEntity(
      input.leaveRequestId
    );

    const canReview = await canReviewLeaveRequest(actor, leaveRequest);
    if (!canReview) {
      throw new Error("Forbidden");
    }

    if (input.status !== LeaveStatus.APPROVED && input.status !== LeaveStatus.REJECTED) {
      throw new Error("Invalid review status");
    }

    return this.leaveService.reviewLeaveRequest(
      input.leaveRequestId,
      actor.id,
      input.status,
      input.reviewRemarks
    );
  }

  async approveLeaveRequest(input: LeaveApprovalInput) {
    const actor = this.requireActor(input.actor);

    const leaveRequest = await this.leaveService.getLeaveRequestEntity(
      input.leaveRequestId
    );

    const canReview = await canReviewLeaveRequest(actor, leaveRequest);
    if (!canReview) {
      throw new Error("Forbidden");
    }

    return this.leaveService.approveLeaveRequest(
      input.leaveRequestId,
      actor.id,
      input.reviewRemarks
    );
  }

  async rejectLeaveRequest(input: LeaveApprovalInput) {
    const actor = this.requireActor(input.actor);

    const leaveRequest = await this.leaveService.getLeaveRequestEntity(
      input.leaveRequestId
    );

    const canReview = await canReviewLeaveRequest(actor, leaveRequest);
    if (!canReview) {
      throw new Error("Forbidden");
    }

    return this.leaveService.reviewLeaveRequest(
      input.leaveRequestId,
      actor.id,
      LeaveStatus.REJECTED,
      input.reviewRemarks
    );
  }

  async cancelLeaveRequest(input: LeaveApprovalInput) {
    const actor = this.requireActor(input.actor);

    const leaveRequest = await this.leaveService.getLeaveRequestEntity(
      input.leaveRequestId
    );

    const canCancel = await canAccessLeaveRequest(actor, leaveRequest);
    if (!canCancel) {
      throw new Error("Forbidden");
    }

    return this.leaveService.cancelLeaveRequest(
      input.leaveRequestId,
      actor.id,
      input.reviewRemarks
    );
  }
}
