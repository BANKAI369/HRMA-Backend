import type { Response } from "express";

const mockService = {
  listAttendanceRecords: jest.fn(),
  createAttendancePunches: jest.fn(),
  listCaptureSchemes: jest.fn(),
  listShiftPolicies: jest.fn(),
  listHolidayCalendars: jest.fn(),
  listTrackingPolicies: jest.fn(),
  listWeeklyOffPolicies: jest.fn(),
};

jest.mock("../services/attendance.service", () => ({
  AttendanceService: jest.fn(() => mockService),
}));

import * as attendanceController from "./attendance.controller";

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

describe("attendance controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists attendance records with parsed pagination", async () => {
    const req = {
      query: {
        page: "2",
        pageSize: "5",
        employeeCode: "EMP001",
        fromDate: "2026-04-01",
      },
    } as any;
    const res = createResponse();
    const serviceResult = {
      data: [{ id: "attendance-1" }],
      pagination: { page: 2, pageSize: 5, total: 1, totalPages: 1 },
    };

    mockService.listAttendanceRecords.mockResolvedValue(serviceResult);

    await attendanceController.getAttendanceRecords(req, res);

    expect(mockService.listAttendanceRecords).toHaveBeenCalledWith({
      employeeCode: "EMP001",
      fromDate: "2026-04-01",
      page: 2,
      pageSize: 5,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(serviceResult);
  });

  it("validates attendance punches payload", async () => {
    const req = {
      body: {
        punches: [
          {
            punchTime: "invalid",
          },
        ],
      },
    } as any;
    const res = createResponse();

    await attendanceController.createAttendancePunches(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockService.createAttendancePunches).not.toHaveBeenCalled();
  });

  it("creates attendance punches", async () => {
    const req = {
      body: {
        punches: [
          {
            employeeCode: "EMP001",
            punchTime: "2026-04-16T04:15:00.000Z",
            punchType: "IN",
          },
        ],
      },
    } as any;
    const res = createResponse();
    const serviceResult = {
      count: 1,
      data: [{ id: "attendance-1", employeeCode: "EMP001" }],
    };

    mockService.createAttendancePunches.mockResolvedValue(serviceResult);

    await attendanceController.createAttendancePunches(req, res);

    expect(mockService.createAttendancePunches).toHaveBeenCalledWith([
      {
        employeeCode: "EMP001",
        punchTime: "2026-04-16T04:15:00.000Z",
        punchType: "IN",
      },
    ]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(serviceResult);
  });

  it("returns weekly off policies", async () => {
    const req = {} as any;
    const res = createResponse();
    const serviceResult = [{ id: "saturday-sunday" }];

    mockService.listWeeklyOffPolicies.mockResolvedValue(serviceResult);

    await attendanceController.getWeeklyOffPolicies(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(serviceResult);
  });
});
