import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { AttendanceService } from "../services/attendance.service";

const service = new AttendanceService();

const punchTypeSchema = z.enum([
  "IN",
  "OUT",
  "BREAK_IN",
  "BREAK_OUT",
  "UNKNOWN",
]);

const nullableTrimmedString = z
  .union([z.string().trim(), z.literal(""), z.null()])
  .optional();

const attendancePunchSchema = z
  .object({
    userId: z.string().uuid("Valid userId is required").optional(),
    employeeCode: nullableTrimmedString,
    attendanceDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .optional(),
    punchTime: z.string().datetime({ offset: true }),
    punchType: punchTypeSchema.optional(),
    captureSchemeId: nullableTrimmedString,
    shiftPolicyId: nullableTrimmedString,
    source: nullableTrimmedString,
    deviceId: nullableTrimmedString,
    remarks: nullableTrimmedString,
    rawPayload: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine((data) => Boolean(data.userId || data.employeeCode), {
    message: "Either userId or employeeCode is required",
    path: ["userId"],
  });

const createAttendancePunchesSchema = z.object({
  punches: z.array(attendancePunchSchema).min(1, "At least one punch is required"),
});

const listAttendanceQuerySchema = z.object({
  userId: z.string().uuid("Valid userId is required").optional(),
  employeeCode: z.string().trim().optional(),
  punchType: punchTypeSchema.optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const parseAttendanceListQuery = (query: AuthRequest["query"]) => {
  const parsed = listAttendanceQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw Object.assign(new Error("Invalid query"), {
      statusCode: 400,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
};

export const getAttendanceRecords = async (req: AuthRequest, res: Response) => {
  try {
    const parsedQuery = parseAttendanceListQuery(req.query);
    return res.status(200).json(await service.listAttendanceRecords(parsedQuery));
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({
      message: error?.message ?? "Failed to fetch attendance records",
      ...(error?.errors ? { errors: error.errors } : {}),
    });
  }
};

export const createAttendancePunches = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const parsed = createAttendancePunchesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return res.status(201).json(
      await service.createAttendancePunches(parsed.data.punches)
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to push attendance punches";
    return res.status(400).json({ message });
  }
};

export const getCaptureSchemes = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listCaptureSchemes());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch capture schemes";
    return res.status(500).json({ message });
  }
};

export const getShiftPolicies = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listShiftPolicies());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch shift policies";
    return res.status(500).json({ message });
  }
};

export const getHolidayCalendars = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listHolidayCalendars());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch holiday calendars";
    return res.status(500).json({ message });
  }
};

export const getTrackingPolicies = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listTrackingPolicies());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tracking policies";
    return res.status(500).json({ message });
  }
};

export const getWeeklyOffPolicies = async (_req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json(await service.listWeeklyOffPolicies());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch weekly off policies";
    return res.status(500).json({ message });
  }
};
