import { AppDataSource } from "../config/data-source";
import { AttendanceRecord } from "../entities/AttendanceRecord";
import { CaptureScheme } from "../entities/CaptureScheme";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { HolidayCalendar } from "../entities/HolidayCalendar";
import { ShiftPolicy } from "../entities/ShiftPolicy";
import { TrackingPolicy } from "../entities/TrackingPolicy";
import { User } from "../entities/User";
import { WeeklyOffPolicy } from "../entities/WeeklyOffPolicy";

const attendanceRepository = AppDataSource.getRepository(AttendanceRecord);
const captureSchemeRepository = AppDataSource.getRepository(CaptureScheme);
const shiftPolicyRepository = AppDataSource.getRepository(ShiftPolicy);
const holidayCalendarRepository = AppDataSource.getRepository(HolidayCalendar);
const trackingPolicyRepository = AppDataSource.getRepository(TrackingPolicy);
const weeklyOffPolicyRepository = AppDataSource.getRepository(WeeklyOffPolicy);
const userRepository = AppDataSource.getRepository(User);
const profileRepository = AppDataSource.getRepository(EmployeeProfile);

type NullableText = string | null | undefined;

export type AttendancePunchType =
  | "IN"
  | "OUT"
  | "BREAK_IN"
  | "BREAK_OUT"
  | "UNKNOWN";

export type CreateAttendancePunchInput = {
  userId?: string;
  employeeCode?: string | null;
  attendanceDate?: string;
  punchTime: string;
  punchType?: AttendancePunchType;
  captureSchemeId?: string | null;
  shiftPolicyId?: string | null;
  source?: string | null;
  deviceId?: string | null;
  remarks?: string | null;
  rawPayload?: Record<string, unknown> | null;
};

export type ListAttendanceInput = {
  userId?: string;
  employeeCode?: string;
  punchType?: AttendancePunchType;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
};

const normalizeOptionalText = (value: NullableText) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const serializeUser = (user: User | null) =>
  user
    ? {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    : null;

const deriveAttendanceDate = (isoDateTime: string) => {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid punchTime");
  }

  return date.toISOString().slice(0, 10);
};

const toNumber = (value: string | number) => Number(value);

export class AttendanceService {
  private serializeAttendanceRecord(record: AttendanceRecord) {
    return {
      id: record.id,
      user: serializeUser(record.user ?? null),
      employeeCode: record.employeeCode,
      attendanceDate: record.attendanceDate,
      punchTime: record.punchTime?.toISOString?.(),
      punchType: record.punchType,
      source: record.source,
      deviceId: record.deviceId,
      remarks: record.remarks,
      captureScheme: record.captureScheme
        ? {
            id: record.captureScheme.id,
            name: record.captureScheme.name,
            mode: record.captureScheme.mode,
          }
        : null,
      shiftPolicy: record.shiftPolicy
        ? {
            id: record.shiftPolicy.id,
            name: record.shiftPolicy.name,
            shiftStart: record.shiftPolicy.shiftStart,
            shiftEnd: record.shiftPolicy.shiftEnd,
          }
        : null,
      rawPayload: record.rawPayload,
      createdAt: record.createdAt?.toISOString?.(),
      updatedAt: record.updatedAt?.toISOString?.(),
    };
  }

  private serializeCaptureScheme(captureScheme: CaptureScheme) {
    return {
      id: captureScheme.id,
      name: captureScheme.name,
      description: captureScheme.description,
      mode: captureScheme.mode,
      graceMinutes: captureScheme.graceMinutes,
      isActive: captureScheme.isActive,
    };
  }

  private serializeShiftPolicy(shiftPolicy: ShiftPolicy) {
    return {
      id: shiftPolicy.id,
      name: shiftPolicy.name,
      description: shiftPolicy.description,
      shiftStart: shiftPolicy.shiftStart,
      shiftEnd: shiftPolicy.shiftEnd,
      lateMarkGraceMinutes: shiftPolicy.lateMarkGraceMinutes,
      halfDayThresholdMinutes: shiftPolicy.halfDayThresholdMinutes,
      isActive: shiftPolicy.isActive,
    };
  }

  private serializeHolidayCalendar(holidayCalendar: HolidayCalendar) {
    return {
      id: holidayCalendar.id,
      name: holidayCalendar.name,
      year: holidayCalendar.year,
      location: holidayCalendar.location
        ? {
            id: holidayCalendar.location.id,
            name: holidayCalendar.location.name,
            countryCode: holidayCalendar.location.countryCode,
          }
        : null,
      holidays: holidayCalendar.holidays,
      isActive: holidayCalendar.isActive,
    };
  }

  private serializeTrackingPolicy(trackingPolicy: TrackingPolicy) {
    return {
      id: trackingPolicy.id,
      name: trackingPolicy.name,
      description: trackingPolicy.description,
      minimumHoursPerDay: toNumber(trackingPolicy.minimumHoursPerDay),
      maximumHoursPerDay: toNumber(trackingPolicy.maximumHoursPerDay),
      allowOvertime: trackingPolicy.allowOvertime,
      isActive: trackingPolicy.isActive,
    };
  }

  private serializeWeeklyOffPolicy(weeklyOffPolicy: WeeklyOffPolicy) {
    return {
      id: weeklyOffPolicy.id,
      name: weeklyOffPolicy.name,
      description: weeklyOffPolicy.description,
      weeklyOffDays: weeklyOffPolicy.weeklyOffDays,
      isAlternateSaturdayOff: weeklyOffPolicy.isAlternateSaturdayOff,
      isActive: weeklyOffPolicy.isActive,
    };
  }

  private async resolveUserAndEmployeeCode(input: {
    userId?: string;
    employeeCode?: string | null;
  }) {
    const normalizedEmployeeCode = normalizeOptionalText(input.employeeCode);
    let resolvedUser: User | null = null;
    let resolvedEmployeeCode: string | null = normalizedEmployeeCode ?? null;

    if (input.userId) {
      resolvedUser = await userRepository.findOne({
        where: { id: input.userId },
      });

      if (!resolvedUser) {
        throw new Error("User not found");
      }

      const profile = await profileRepository.findOne({
        where: { userId: resolvedUser.id },
      });

      if (
        normalizedEmployeeCode &&
        profile?.employeeCode &&
        profile.employeeCode !== normalizedEmployeeCode
      ) {
        throw new Error("employeeCode does not match the provided userId");
      }

      resolvedEmployeeCode = normalizedEmployeeCode ?? profile?.employeeCode ?? null;
    }

    if (!resolvedUser && normalizedEmployeeCode) {
      const profile = await profileRepository.findOne({
        where: { employeeCode: normalizedEmployeeCode },
        relations: ["user"],
      });

      if (!profile?.user) {
        throw new Error("Employee not found for employeeCode");
      }

      resolvedUser = profile.user;
      resolvedEmployeeCode = profile.employeeCode;
    }

    return {
      user: resolvedUser,
      employeeCode: resolvedEmployeeCode,
    };
  }

  private async ensureCaptureScheme(captureSchemeId: string | null | undefined) {
    if (!captureSchemeId) {
      return null;
    }

    const captureScheme = await captureSchemeRepository.findOne({
      where: { id: captureSchemeId },
    });

    if (!captureScheme) {
      throw new Error("Capture scheme not found");
    }

    return captureScheme;
  }

  private async ensureShiftPolicy(shiftPolicyId: string | null | undefined) {
    if (!shiftPolicyId) {
      return null;
    }

    const shiftPolicy = await shiftPolicyRepository.findOne({
      where: { id: shiftPolicyId },
    });

    if (!shiftPolicy) {
      throw new Error("Shift policy not found");
    }

    return shiftPolicy;
  }

  async createAttendancePunches(punches: CreateAttendancePunchInput[]) {
    const savedIds = await AppDataSource.transaction(async (manager) => {
      const ids: string[] = [];

      for (const punch of punches) {
        const resolvedIdentity = await this.resolveUserAndEmployeeCode({
          userId: punch.userId,
          employeeCode: punch.employeeCode,
        });

        if (!resolvedIdentity.user && !resolvedIdentity.employeeCode) {
          throw new Error("Either userId or employeeCode is required");
        }

        const [captureScheme, shiftPolicy] = await Promise.all([
          this.ensureCaptureScheme(punch.captureSchemeId),
          this.ensureShiftPolicy(punch.shiftPolicyId),
        ]);

        const attendanceRecord = manager.create(AttendanceRecord, {
          user: resolvedIdentity.user,
          userId: resolvedIdentity.user?.id ?? null,
          employeeCode: resolvedIdentity.employeeCode,
          captureScheme: captureScheme ?? null,
          captureSchemeId: captureScheme?.id ?? null,
          shiftPolicy: shiftPolicy ?? null,
          shiftPolicyId: shiftPolicy?.id ?? null,
          attendanceDate: punch.attendanceDate ?? deriveAttendanceDate(punch.punchTime),
          punchTime: new Date(punch.punchTime),
          punchType: punch.punchType ?? "IN",
          source: normalizeOptionalText(punch.source) ?? "manual",
          deviceId: normalizeOptionalText(punch.deviceId) ?? null,
          remarks: normalizeOptionalText(punch.remarks) ?? null,
          rawPayload: punch.rawPayload ?? null,
        });

        const savedRecord = await manager.save(AttendanceRecord, attendanceRecord);
        ids.push(savedRecord.id);
      }

      return ids;
    });

    const records = await attendanceRepository.find({
      where: savedIds.map((id) => ({ id })),
      relations: ["user", "captureScheme", "shiftPolicy"],
      order: { punchTime: "DESC" },
    });

    return {
      count: records.length,
      data: records.map((record) => this.serializeAttendanceRecord(record)),
    };
  }

  async listAttendanceRecords(input: ListAttendanceInput) {
    const query = attendanceRepository
      .createQueryBuilder("attendance")
      .leftJoinAndSelect("attendance.user", "user")
      .leftJoinAndSelect("attendance.captureScheme", "captureScheme")
      .leftJoinAndSelect("attendance.shiftPolicy", "shiftPolicy")
      .orderBy("attendance.punchTime", "DESC")
      .skip((input.page - 1) * input.pageSize)
      .take(input.pageSize);

    if (input.userId) {
      query.andWhere("attendance.userId = :userId", { userId: input.userId });
    }

    if (input.employeeCode) {
      query.andWhere("attendance.employeeCode = :employeeCode", {
        employeeCode: input.employeeCode,
      });
    }

    if (input.punchType) {
      query.andWhere("attendance.punchType = :punchType", {
        punchType: input.punchType,
      });
    }

    if (input.fromDate) {
      query.andWhere("attendance.attendanceDate >= :fromDate", {
        fromDate: input.fromDate,
      });
    }

    if (input.toDate) {
      query.andWhere("attendance.attendanceDate <= :toDate", {
        toDate: input.toDate,
      });
    }

    const [records, total] = await query.getManyAndCount();

    return {
      data: records.map((record) => this.serializeAttendanceRecord(record)),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: total ? Math.ceil(total / input.pageSize) : 0,
      },
    };
  }

  async listCaptureSchemes() {
    const schemes = await captureSchemeRepository.find({
      order: { name: "ASC" },
    });

    return schemes.map((scheme) => this.serializeCaptureScheme(scheme));
  }

  async listShiftPolicies() {
    const policies = await shiftPolicyRepository.find({
      order: { name: "ASC" },
    });

    return policies.map((policy) => this.serializeShiftPolicy(policy));
  }

  async listHolidayCalendars() {
    const calendars = await holidayCalendarRepository.find({
      relations: ["location"],
      order: { year: "DESC", name: "ASC" },
    });

    return calendars.map((calendar) => this.serializeHolidayCalendar(calendar));
  }

  async listTrackingPolicies() {
    const policies = await trackingPolicyRepository.find({
      order: { name: "ASC" },
    });

    return policies.map((policy) => this.serializeTrackingPolicy(policy));
  }

  async listWeeklyOffPolicies() {
    const policies = await weeklyOffPolicyRepository.find({
      order: { name: "ASC" },
    });

    return policies.map((policy) => this.serializeWeeklyOffPolicy(policy));
  }
}
