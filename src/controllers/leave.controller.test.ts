import type { Response } from "express";
import { LeaveStatus } from "../utils/leave-status.enum";

const mockService = {
  createLeaveType: jest.fn(),
  listLeaveTypes: jest.fn(),
  listLeavePlans: jest.fn(),
  getLeaveType: jest.fn(),
  updateLeaveType: jest.fn(),
  createLeaveRequest: jest.fn(),
  listLeaveBalances: jest.fn(),
  listLeaveRequests: jest.fn(),
  getLeaveRequest: jest.fn(),
  getLeaveRequestEntity: jest.fn(),
  updatePendingLeaveRequest: jest.fn(),
  reviewLeaveRequest: jest.fn(),
  cancelLeaveRequest: jest.fn(),
};

jest.mock("../services/leave.service", () => ({
  LeaveService: jest.fn(() => mockService),
}));

jest.mock("../services/leave-access.service", () => ({
  canAccessLeaveRequest: jest.fn(),
  canAccessUserLeaves: jest.fn(),
  canReviewLeaveRequest: jest.fn(),
  getAccessibleLeaveUserIds: jest.fn(),
  hasLeaveAdminAccess: jest.fn(),
}));

jest.mock("../utils/auth-user.utils", () => ({
  resolveAuthenticatedUser: jest.fn(),
}));

import * as leaveController from "./leave.controller";
import * as accessService from "../services/leave-access.service";
import * as authUserUtils from "../utils/auth-user.utils";

const mockedAccessService = jest.mocked(accessService);
const mockedAuthUserUtils = jest.mocked(authUserUtils);

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  return res as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
};

describe("leave controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns scoped leave requests for accessible users", async () => {
    const req = {
      query: { page: "2", pageSize: "5", status: LeaveStatus.PENDING },
    } as any;
    const res = createResponse();
    const actor = { id: "actor-1", isActive: true, role: { name: "Manager" } };
    const serviceResult = {
      data: [{ id: "leave-1" }],
      pagination: { page: 2, pageSize: 5, total: 1, totalPages: 1 },
    };

    mockedAuthUserUtils.resolveAuthenticatedUser.mockResolvedValue(actor as any);
    mockedAccessService.getAccessibleLeaveUserIds.mockResolvedValue([
      "actor-1",
      "employee-1",
    ]);
    mockService.listLeaveRequests.mockResolvedValue(serviceResult);

    await leaveController.getLeaveRequests(req, res);

    expect(mockService.listLeaveRequests).toHaveBeenCalledWith({
      accessibleUserIds: ["actor-1", "employee-1"],
      page: 2,
      pageSize: 5,
      status: LeaveStatus.PENDING,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(serviceResult);
  });

  it("blocks creating leave for an inaccessible user", async () => {
    const req = {
      body: {
        userId: "11111111-1111-4111-8111-111111111111",
        leaveTypeId: "22222222-2222-4222-8222-222222222222",
        startDate: "2026-05-01",
        endDate: "2026-05-02",
      },
    } as any;
    const res = createResponse();
    const actor = {
      id: "33333333-3333-4333-8333-333333333333",
      isActive: true,
      role: { name: "Employee" },
    };

    mockedAuthUserUtils.resolveAuthenticatedUser.mockResolvedValue(actor as any);
    mockedAccessService.canAccessUserLeaves.mockResolvedValue(false);

    await leaveController.createLeaveRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    expect(mockService.createLeaveRequest).not.toHaveBeenCalled();
  });

  it("reviews a leave request when the actor has review access", async () => {
    const req = {
      params: { id: "44444444-4444-4444-8444-444444444444" },
      body: {
        status: LeaveStatus.APPROVED,
        reviewRemarks: "Approved",
      },
    } as any;
    const res = createResponse();
    const actor = { id: "actor-1", isActive: true, role: { name: "Manager" } };
    const leaveRequestEntity = {
      id: "44444444-4444-4444-8444-444444444444",
      userId: "employee-1",
    };
    const reviewedLeaveRequest = {
      id: leaveRequestEntity.id,
      status: LeaveStatus.APPROVED,
    };

    mockedAuthUserUtils.resolveAuthenticatedUser.mockResolvedValue(actor as any);
    mockService.getLeaveRequestEntity.mockResolvedValue(leaveRequestEntity);
    mockedAccessService.canReviewLeaveRequest.mockResolvedValue(true);
    mockService.reviewLeaveRequest.mockResolvedValue(reviewedLeaveRequest);

    await leaveController.reviewLeaveRequest(req, res);

    expect(mockService.reviewLeaveRequest).toHaveBeenCalledWith(
      leaveRequestEntity.id,
      "actor-1",
      LeaveStatus.APPROVED,
      "Approved"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Leave request reviewed successfully",
      data: reviewedLeaveRequest,
    });
  });

  it("returns leave balances for an accessible user", async () => {
    const req = {
      query: {
        userId: "11111111-1111-4111-8111-111111111111",
        year: "2026",
      },
    } as any;
    const res = createResponse();
    const actor = { id: "actor-1", isActive: true, role: { name: "Manager" } };
    const balanceResult = {
      userId: "11111111-1111-4111-8111-111111111111",
      year: 2026,
      data: [],
      summary: {
        allocatedDays: 0,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: 0,
      },
    };

    mockedAuthUserUtils.resolveAuthenticatedUser.mockResolvedValue(actor as any);
    mockedAccessService.canAccessUserLeaves.mockResolvedValue(true);
    mockService.listLeaveBalances.mockResolvedValue(balanceResult);

    await leaveController.getLeaveBalances(req, res);

    expect(mockService.listLeaveBalances).toHaveBeenCalledWith({
      userId: "11111111-1111-4111-8111-111111111111",
      year: 2026,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(balanceResult);
  });

  it("returns leave plans", async () => {
    const req = {} as any;
    const res = createResponse();
    const plans = [{ id: "plan-1", name: "Annual Leave" }];

    mockService.listLeavePlans.mockResolvedValue(plans);

    await leaveController.getLeavePlans(req, res);

    expect(mockService.listLeavePlans).toHaveBeenCalledWith();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(plans);
  });
});
