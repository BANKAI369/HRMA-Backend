import { In, LessThanOrEqual, MoreThanOrEqual, Not } from "typeorm";
import { Injectable } from "@nestjs/common";
import { AppDataSource } from "../../config/data-source";
import { LeaveRequest } from "../../entities/LeaveRequest";
import { LeaveType } from "../../entities/LeaveType";
import { Tenant } from "../../entities/Tenant";
import { User } from "../../entities/User";
import { auditLogService, buildAuditDiff } from "../../services/audit-log.service";
import { LeaveStatus } from "../../utils/leave-status.enum";
import { LeaveBalanceService } from "../leave-balance/leaveBalance.service";
import { HolidayService } from "../holiday/holiday.service";
import { CalendarEventDto } from "../calendar/dto/calendar-response.dto";

const leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);
const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
const tenantRepo = AppDataSource.getRepository(Tenant);
const userRepo = AppDataSource.getRepository(User);
const leaveBalanceService = new LeaveBalanceService();
const holidayService = new HolidayService();

type NullableInput = string | null | undefined;

type CalendarHolidaySummary = {
  name: string;
  date: string;
};

type LeaveCalendarBreakdown = {
  workingDays: number;
  holidays: CalendarHolidaySummary[];
  weekends: string[];
};

type CreateLeaveRequestResponse = {
  leaveRequest: Awaited<ReturnType<LeaveService["getLeaveRequest"]>>;
  pendingRequest: {
    workingDays: number;
    holidays: CalendarHolidaySummary[];
    weekends: string[];
    status: LeaveStatus;
    leaveTypeId: string;
    userId: string;
  };
};

export type CreateLeaveTypeInput = {
  name: string;
  description?: string | null;
  annualAllowanceDays?: number;
  isPaid?: boolean;
  isActive?: boolean;
};

export type UpdateLeaveTypeInput = Partial<CreateLeaveTypeInput>;

export type CreateLeaveRequestInput = {
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
};

export type UpdateLeaveRequestInput = Partial<CreateLeaveRequestInput>;

export type ListLeaveRequestsInput = {
  accessibleUserIds?: string[] | null;
  userId?: string;
  status?: LeaveStatus;
  leaveTypeId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page: number;
  pageSize: number;
};

export type ListLeaveBalancesInput = {
  userId: string;
  year: number;
};

const normalizeOptionalText = (value: NullableInput): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const parseDateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return date;
};

const isWeekend = (date: Date) => {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

const calculateLeaveCalendarBreakdown = async (
  startDate: string,
  endDate: string,
  tenantId?: string | null
): Promise<LeaveCalendarBreakdown> => {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (end < start) {
    throw new Error("endDate cannot be before startDate");
  }

  const holidays = await holidayService.getHolidaysBetween(
    startDate,
    endDate,
    tenantId
  );

  const holidayByDate = new Map(
    holidays.map((holiday) => [
      holiday.date,
      {
        name: holiday.name,
        date: holiday.date,
      },
    ])
  );

  const breakdown: LeaveCalendarBreakdown = {
    workingDays: 0,
    holidays: [],
    weekends: [],
  };

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().split("T")[0];
    const weekend = isWeekend(d);
    const holiday = await holidayService.isHoliday(iso, tenantId);

    if (weekend) {
      breakdown.weekends.push(iso);
    }

    if (holiday) {
      const holidaySummary = holidayByDate.get(iso);
      if (holidaySummary) {
        breakdown.holidays.push(holidaySummary);
      }
    }

    if (!weekend && !holiday) {
      breakdown.workingDays += 1;
    }
  }

  return breakdown;
};

const serializeUser = (user: User | null | undefined) =>
  user
    ? {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    : null;

const buildLeaveSnapshot = (leaveRequest: LeaveRequest) => ({
  userId: leaveRequest.userId,
  leaveTypeId: leaveRequest.leaveTypeId,
  startDate: leaveRequest.startDate,
  endDate: leaveRequest.endDate,
  totalDays: Number(leaveRequest.totalDays),
  reason: leaveRequest.reason ?? null,
  status: leaveRequest.status,
  reviewedBy: leaveRequest.reviewedBy ?? null,
  reviewedAt: leaveRequest.reviewedAt?.toISOString?.() ?? null,
  reviewRemarks: leaveRequest.reviewRemarks ?? null,
});

const getHolidayOverlap = async (
  startDate: string,
  endDate: string,
  tenantId?: string | null
) => {
  const holidays = await holidayService.getHolidaysBetween(startDate, endDate, tenantId);

  return holidays.map((holiday) => ({
    id: holiday.id,
    name: holiday.name,
    date: holiday.date,
    type: holiday.type,
    isRecurring: holiday.isRecurring,
    tenantId: holiday.tenantId ?? null,
    region: holiday.region ?? null,
  }));
};

@Injectable()
export class LeaveService {
  private serializeLeaveType(leaveType: LeaveType) {
    return {
      id: leaveType.id,
      name: leaveType.name,
      description: leaveType.description,
      annualAllowanceDays: leaveType.annualAllowanceDays,
      isPaid: leaveType.isPaid,
      isActive: leaveType.isActive,
      createdAt: leaveType.createdAt?.toISOString?.(),
      updatedAt: leaveType.updatedAt?.toISOString?.(),
    };
  }

  private serializeLeaveRequest(
    leaveRequest: LeaveRequest,
    overlappingHolidays: Array<{
      id: string;
      name: string;
      date: string;
      type: string;
      isRecurring: boolean;
      tenantId: string | null;
      region: string | null;
    }> = [],
    calendarBreakdown?: LeaveCalendarBreakdown
  ) {
    return {
      id: leaveRequest.id,
      user: serializeUser(leaveRequest.user),
      leaveType: leaveRequest.leaveType
        ? this.serializeLeaveType(leaveRequest.leaveType)
        : null,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      totalDays: Number(leaveRequest.totalDays),
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      reviewedBy: serializeUser(leaveRequest.reviewedByUser),
      reviewedAt: leaveRequest.reviewedAt?.toISOString?.() ?? null,
      reviewRemarks: leaveRequest.reviewRemarks,
      overlappingHolidays,
      workingDays:
        calendarBreakdown?.workingDays ?? Number(leaveRequest.totalDays),
      holidays:
        calendarBreakdown?.holidays ??
        overlappingHolidays.map((holiday) => ({
          name: holiday.name,
          date: holiday.date,
        })),
      weekends: calendarBreakdown?.weekends ?? [],
      createdAt: (leaveRequest as any).createdAt?.toISOString?.(),
      updatedAt: (leaveRequest as any).updatedAt?.toISOString?.(),
    };
  }

  private serializeLeavePlan(leaveType: LeaveType) {
    return {
      id: leaveType.id,
      name: leaveType.name,
      description: leaveType.description,
      annualAllowanceDays: leaveType.annualAllowanceDays,
      isPaid: leaveType.isPaid,
      isActive: leaveType.isActive,
    };
  }

  private async findLeaveRequestEntity(id: string) {
    const leaveRequest = await leaveRequestRepo.findOne({
      where: { id },
      relations: ["user", "leaveType", "reviewedByUser"],
    });

    if (!leaveRequest) {
      throw new Error("Leave request not found");
    }

    return leaveRequest;
  }

  private async ensureUser(userId: string) {
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  private async ensureTenant(tenantId?: string | null) {
    if (!tenantId) {
      throw new Error("Tenant not found");
    }

    const tenant = await tenantRepo.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    return tenant;
  }

  private async ensureActiveLeaveType(leaveTypeId: string) {
    const leaveType = await leaveTypeRepo.findOne({
      where: { id: leaveTypeId, isActive: true },
    });

    if (!leaveType) {
      throw new Error("Leave type not found or inactive");
    }

    return leaveType;
  }

  private async ensureNoOverlappingPendingOrApprovedLeave(
    userId: string,
    startDate: string,
    endDate: string,
    ignoredLeaveRequestId?: string
  ) {
    const where: any = {
      user: { id: userId },
      status: In([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
      startDate: LessThanOrEqual(endDate),
      endDate: MoreThanOrEqual(startDate),
    };

    if (ignoredLeaveRequestId) {
      where.id = Not(ignoredLeaveRequestId);
    }

    const overlappingRequest = await leaveRequestRepo.findOne({ where });

    if (overlappingRequest) {
      throw new Error("Employee already has an overlapping leave request");
    }
  }

  async createLeaveType(
    data: CreateLeaveTypeInput,
    options: { actorUserId?: string | null } = {}
  ) {
    const name = data.name.trim();
    const existing = await leaveTypeRepo.findOne({ where: { name } });

    if (existing) {
      throw new Error("Leave type already exists");
    }

    const leaveType = leaveTypeRepo.create({
      name,
      description: normalizeOptionalText(data.description),
      annualAllowanceDays: data.annualAllowanceDays ?? 0,
      isPaid: data.isPaid ?? true,
      isActive: data.isActive ?? true,
    });

    const savedLeaveType = await leaveTypeRepo.save(leaveType);
    await auditLogService.log({
      actorUserId: options.actorUserId ?? null,
      action: "LEAVE_TYPE_CREATED",
      entityType: "leave_type",
      entityId: savedLeaveType.id,
      newValue: this.serializeLeaveType(savedLeaveType),
    });

    return this.serializeLeaveType(savedLeaveType);
  }

  async listLeaveTypes(includeInactive = false) {
    const leaveTypes = await leaveTypeRepo.find({
      where: includeInactive ? {} : { isActive: true },
      order: { name: "ASC" },
    });

    return leaveTypes.map((leaveType) => this.serializeLeaveType(leaveType));
  }

  async listLeavePlans() {
    const leaveTypes = await leaveTypeRepo.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });

    return leaveTypes.map((leaveType) => this.serializeLeavePlan(leaveType));
  }

  async getLeaveType(id: string) {
    const leaveType = await leaveTypeRepo.findOne({ where: { id } });

    if (!leaveType) {
      throw new Error("Leave type not found");
    }

    return this.serializeLeaveType(leaveType);
  }

  async updateLeaveType(
    id: string,
    data: UpdateLeaveTypeInput,
    options: { actorUserId?: string | null } = {}
  ) {
    const leaveType = await leaveTypeRepo.findOne({ where: { id } });

    if (!leaveType) {
      throw new Error("Leave type not found");
    }

    const previousSnapshot = this.serializeLeaveType(leaveType);

    if (data.name !== undefined) {
      const name = data.name.trim();
      const existing = await leaveTypeRepo.findOne({ where: { name } });
      if (existing && existing.id !== id) {
        throw new Error("Leave type already exists");
      }
      leaveType.name = name;
    }

    if (data.description !== undefined) {
      leaveType.description = normalizeOptionalText(data.description) ?? "";
    }

    if (data.annualAllowanceDays !== undefined) {
      leaveType.annualAllowanceDays = data.annualAllowanceDays;
    }

    if (data.isPaid !== undefined) {
      leaveType.isPaid = data.isPaid;
    }

    if (data.isActive !== undefined) {
      leaveType.isActive = data.isActive;
    }

    const savedLeaveType = await leaveTypeRepo.save<LeaveType>(leaveType);
    const nextSnapshot = this.serializeLeaveType(savedLeaveType);
    const auditDiff = buildAuditDiff(previousSnapshot, nextSnapshot);

    if (auditDiff.hasChanges) {
      await auditLogService.log({
        actorUserId: options.actorUserId ?? null,
        action: "LEAVE_TYPE_UPDATED",
        entityType: "leave_type",
        entityId: savedLeaveType.id,
        oldValue: auditDiff.oldValue,
        newValue: auditDiff.newValue,
      });
    }

    return nextSnapshot;
  }

  async createLeaveRequest(
    data: CreateLeaveRequestInput,
    options: { actorUserId?: string | null } = {}
  ): Promise<CreateLeaveRequestResponse> {
    const user = await this.ensureUser(data.userId);
    const tenant = await this.ensureTenant(user.tenantId);
    const leaveType = await this.ensureActiveLeaveType(data.leaveTypeId);

    if (tenant.id !== leaveType.tenantId) {
      throw new Error("Leave type not found or inactive");
    }

    const calendarBreakdown = await calculateLeaveCalendarBreakdown(
      data.startDate,
      data.endDate,
      tenant.id
    );
    const totalDays = calendarBreakdown.workingDays;

    await this.ensureNoOverlappingPendingOrApprovedLeave(
      user.id,
      data.startDate,
      data.endDate
    );

    const leaveRequestId = await AppDataSource.transaction(async (manager) => {
      const leaveRequest = manager.create(LeaveRequest, {
        user,
        userId: user.id,
        leaveType,
        leaveTypeId: leaveType.id,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays,
        reason: normalizeOptionalText(data.reason) ?? null,
        status: leaveType.requiresApproval
          ? LeaveStatus.PENDING
          : LeaveStatus.APPROVED,
        reviewedBy: null,
        reviewedAt: null,
        reviewRemarks: null,
      });

      const savedLeaveRequest = await manager.save(LeaveRequest, leaveRequest);
      const balanceMutationInput = {
        employeeId: user.id,
        leaveTypeId: leaveType.id,
        days: totalDays,
        year: new Date(data.startDate).getUTCFullYear(),
      };

      if (leaveType.requiresApproval) {
        await leaveBalanceService.reserveLeave(
          balanceMutationInput,
          tenant.id,
          manager
        );
      } else {
        await leaveBalanceService.approveLeave(balanceMutationInput, tenant.id, manager);
      }

      await auditLogService.log(
        {
          actorUserId: options.actorUserId ?? null,
          action: "LEAVE_REQUEST_CREATED",
          entityType: "leave_request",
          entityId: savedLeaveRequest.id,
          newValue: buildLeaveSnapshot(savedLeaveRequest),
        },
        manager
      );

      return savedLeaveRequest.id;
    });

    const createdLeaveRequest = await this.getLeaveRequest(leaveRequestId);
    return {
      leaveRequest: createdLeaveRequest,
      pendingRequest: {
        workingDays: calendarBreakdown.workingDays,
        holidays: calendarBreakdown.holidays,
        weekends: calendarBreakdown.weekends,
        status: leaveType.requiresApproval
          ? LeaveStatus.PENDING
          : LeaveStatus.APPROVED,
        leaveTypeId: leaveType.id,
        userId: user.id,
      },
    };
  }

  private serializeLeaveCalendarEvent(leaveRequest: LeaveRequest): CalendarEventDto {
    const statusMap: Record<string, "APPROVED" | "PENDING" | "REJECTED"> = {
      [LeaveStatus.APPROVED]: "APPROVED",
      [LeaveStatus.PENDING]: "PENDING",
      [LeaveStatus.REJECTED]: "REJECTED",
    };

    const status = statusMap[leaveRequest.status];
    const userName = [leaveRequest.user?.username]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined;
    const titleParts = [leaveRequest.user?.username, leaveRequest.leaveType?.name]
      .filter(Boolean)
      .join(" - ");

    return {
      id: `leave-${leaveRequest.id}`,
      title: titleParts || "Leave Request",
      type: "LEAVE",
      startDate: new Date(`${leaveRequest.startDate}T00:00:00.000Z`),
      endDate: new Date(`${leaveRequest.endDate}T00:00:00.000Z`),
      status,
      userId: leaveRequest.userId,
      userName,
      color:
        status === "APPROVED"
          ? "#52c41a"
          : status === "PENDING"
            ? "#faad14"
            : "#ff4d4f",
    };
  }

  async listLeaveRequests(input: ListLeaveRequestsInput) {
    if (input.accessibleUserIds && !input.accessibleUserIds.length) {
      return {
        data: [],
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const query = leaveRequestRepo
      .createQueryBuilder("leaveRequest")
      .leftJoinAndSelect("leaveRequest.user", "user")
      .leftJoinAndSelect("leaveRequest.leaveType", "leaveType")
      .leftJoinAndSelect("leaveRequest.reviewedByUser", "reviewedByUser")
      .orderBy("leaveRequest.createdAt", "DESC")
      .skip((input.page - 1) * input.pageSize)
      .take(input.pageSize);

    if (input.accessibleUserIds) {
      query.andWhere("user.id IN (:...accessibleUserIds)", {
        accessibleUserIds: input.accessibleUserIds,
      });
    }

    if (input.userId) {
      query.andWhere("user.id = :userId", {
        userId: input.userId,
      });
    }

    if (input.status) {
      query.andWhere("leaveRequest.status = :status", {
        status: input.status,
      });
    }

    if (input.leaveTypeId) {
      query.andWhere("leaveType.id = :leaveTypeId", {
        leaveTypeId: input.leaveTypeId,
      });
    }

    if (input.fromDate) {
      query.andWhere("leaveRequest.endDate >= :fromDate", {
        fromDate: input.fromDate,
      });
    }

    if (input.toDate) {
      query.andWhere("leaveRequest.startDate <= :toDate", {
        toDate: input.toDate,
      });
    }

    if (input.search) {
      query.andWhere(
        `(LOWER(COALESCE(leaveRequest.reason, '')) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(leaveType.name) LIKE :search)`,
        { search: `%${input.search.toLowerCase()}%` }
      );
    }

    const [leaveRequests, total] = await query.getManyAndCount();

    return {
      data: leaveRequests.map((leaveRequest) =>
        this.serializeLeaveRequest(leaveRequest)
      ),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: total ? Math.ceil(total / input.pageSize) : 0,
      },
    };
  }

  async getLeaveRequest(id: string) {
    const leaveRequest = await this.findLeaveRequestEntity(id);
    const overlappingHolidays = await getHolidayOverlap(
      leaveRequest.startDate,
      leaveRequest.endDate,
      leaveRequest.user?.tenantId
    );
    const calendarBreakdown = leaveRequest.user?.tenantId
      ? await calculateLeaveCalendarBreakdown(
          leaveRequest.startDate,
          leaveRequest.endDate,
          leaveRequest.user.tenantId
        )
      : undefined;
    return this.serializeLeaveRequest(
      leaveRequest,
      overlappingHolidays,
      calendarBreakdown
    );
  }

  async getCalendarEvents(
    startDate: string,
    endDate: string,
    filters: {
      tenantId?: string | null;
      userId?: string | null;
      departmentId?: string | null;
    } = {}
  ): Promise<CalendarEventDto[]> {
    const query = leaveRequestRepo
      .createQueryBuilder("leaveRequest")
      .leftJoinAndSelect("leaveRequest.user", "user")
      .leftJoinAndSelect("leaveRequest.leaveType", "leaveType")
      .where("leaveRequest.startDate <= :endDate", { endDate })
      .andWhere("leaveRequest.endDate >= :startDate", { startDate })
      .andWhere("leaveRequest.status IN (:...statuses)", {
        statuses: [LeaveStatus.PENDING, LeaveStatus.APPROVED, LeaveStatus.REJECTED],
      });

    if (filters.tenantId) {
      query.andWhere("user.tenantId = :tenantId", {
        tenantId: filters.tenantId,
      });
    }

    if (filters.userId) {
      query.andWhere("leaveRequest.userId = :userId", { userId: filters.userId });
    }

    if (filters.departmentId) {
      query.andWhere("user.departmentId = :departmentId", {
        departmentId: filters.departmentId,
      });
    }

    const leaveRequests = await query.getMany();
    return leaveRequests.map((leaveRequest) =>
      this.serializeLeaveCalendarEvent(leaveRequest)
    );
  }

  async getLeaveRequestEntity(id: string) {
    return this.findLeaveRequestEntity(id);
  }

  async listLeaveBalances(input: ListLeaveBalancesInput) {
    const yearStart = `${input.year}-01-01`;
    const yearEnd = `${input.year}-12-31`;

    const [leaveTypes, leaveRequests] = await Promise.all([
      leaveTypeRepo.find({
        where: { isActive: true },
        order: { name: "ASC" },
      }),
      leaveRequestRepo.find({
        where: {
          user: { id: input.userId },
          status: In([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
          startDate: LessThanOrEqual(yearEnd),
          endDate: MoreThanOrEqual(yearStart),
        },
        relations: ["leaveType"],
      }),
    ]);

    const balances = leaveTypes.map((leaveType) => {
      const matchingRequests = leaveRequests.filter(
        (leaveRequest) => leaveRequest.leaveTypeId === leaveType.id
      );
      const usedDays = matchingRequests
        .filter((leaveRequest) => leaveRequest.status === LeaveStatus.APPROVED)
        .reduce(
          (total, leaveRequest) => total + Number(leaveRequest.totalDays),
          0
        );
      const pendingDays = matchingRequests
        .filter((leaveRequest) => leaveRequest.status === LeaveStatus.PENDING)
        .reduce(
          (total, leaveRequest) => total + Number(leaveRequest.totalDays),
          0
        );
      const allocatedDays = leaveType.annualAllowanceDays;
      const remainingDays = allocatedDays - usedDays;

      return {
        leaveType: this.serializeLeavePlan(leaveType),
        allocatedDays,
        usedDays,
        pendingDays,
        remainingDays,
      };
    });

    return {
      userId: input.userId,
      year: input.year,
      data: balances,
      summary: {
        allocatedDays: balances.reduce(
          (total, balance) => total + balance.allocatedDays,
          0
        ),
        usedDays: balances.reduce((total, balance) => total + balance.usedDays, 0),
        pendingDays: balances.reduce(
          (total, balance) => total + balance.pendingDays,
          0
        ),
        remainingDays: balances.reduce(
          (total, balance) => total + balance.remainingDays,
          0
        ),
      },
    };
  }

  async updatePendingLeaveRequest(
    id: string,
    data: UpdateLeaveRequestInput,
    options: { actorUserId?: string | null } = {}
  ) {
    const leaveRequest = await this.findLeaveRequestEntity(id);

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new Error("Only pending leave requests can be updated");
    }

    const previousSnapshot = buildLeaveSnapshot(leaveRequest);
    const previousUserId = leaveRequest.userId;
    const previousLeaveTypeId = leaveRequest.leaveTypeId;
    const previousTotalDays = Number(leaveRequest.totalDays);
    const previousYear = new Date(leaveRequest.startDate).getUTCFullYear();
    const previousTenantId = leaveRequest.user?.tenantId ?? undefined;

    if (data.userId !== undefined && data.userId !== leaveRequest.userId) {
      leaveRequest.user = await this.ensureUser(data.userId);
      leaveRequest.userId = data.userId;
    }

    if (data.leaveTypeId !== undefined) {
      leaveRequest.leaveType = await this.ensureActiveLeaveType(data.leaveTypeId);
      leaveRequest.leaveTypeId = data.leaveTypeId;
    }

    if (data.startDate !== undefined) {
      leaveRequest.startDate = data.startDate;
    }

    if (data.endDate !== undefined) {
      leaveRequest.endDate = data.endDate;
    }

    if (data.reason !== undefined) {
      leaveRequest.reason = normalizeOptionalText(data.reason) ?? null;
    }

    if (leaveRequest.user?.tenantId !== leaveRequest.leaveType?.tenantId) {
      throw new Error("Leave type not found or inactive");
    }

    const calendarBreakdown = await calculateLeaveCalendarBreakdown(
      leaveRequest.startDate,
      leaveRequest.endDate,
      leaveRequest.user?.tenantId
    );
    leaveRequest.totalDays = calendarBreakdown.workingDays;

    await this.ensureNoOverlappingPendingOrApprovedLeave(
      leaveRequest.userId,
      leaveRequest.startDate,
      leaveRequest.endDate,
      leaveRequest.id
    );

    const savedLeaveRequest = await AppDataSource.transaction(async (manager) => {
      if (
        previousUserId !== leaveRequest.userId ||
        previousLeaveTypeId !== leaveRequest.leaveTypeId
      ) {
        await leaveBalanceService.releasePendingLeave(
          {
            employeeId: previousUserId,
            leaveTypeId: previousLeaveTypeId,
            days: previousTotalDays,
            year: previousYear,
          },
          previousTenantId,
          manager
        );
      } else if (previousTotalDays !== leaveRequest.totalDays) {
        const delta = leaveRequest.totalDays - previousTotalDays;

        if (delta > 0) {
          await leaveBalanceService.reserveLeave(
            {
              employeeId: leaveRequest.userId,
              leaveTypeId: leaveRequest.leaveTypeId,
              days: delta,
              year: new Date(leaveRequest.startDate).getUTCFullYear(),
            },
            leaveRequest.user?.tenantId ?? undefined,
            manager
          );
        } else if (delta < 0) {
          await leaveBalanceService.releasePendingLeave(
            {
              employeeId: leaveRequest.userId,
              leaveTypeId: leaveRequest.leaveTypeId,
              days: Math.abs(delta),
              year: new Date(leaveRequest.startDate).getUTCFullYear(),
            },
            leaveRequest.user?.tenantId ?? undefined,
            manager
          );
        }
      }

      const persistedLeaveRequest = await leaveRequestRepo.save(leaveRequest);

      if (
        previousUserId !== leaveRequest.userId ||
        previousLeaveTypeId !== leaveRequest.leaveTypeId
      ) {
        await leaveBalanceService.reserveLeave(
          {
            employeeId: persistedLeaveRequest.userId,
            leaveTypeId: persistedLeaveRequest.leaveTypeId,
            days: persistedLeaveRequest.totalDays,
            year: new Date(persistedLeaveRequest.startDate).getUTCFullYear(),
          },
          persistedLeaveRequest.user?.tenantId ?? undefined,
          manager
        );
      }

      const nextSnapshot = buildLeaveSnapshot(persistedLeaveRequest);
      const auditDiff = buildAuditDiff(previousSnapshot, nextSnapshot);

      if (auditDiff.hasChanges) {
        await auditLogService.log(
          {
            actorUserId: options.actorUserId ?? null,
            action: "LEAVE_REQUEST_UPDATED",
            entityType: "leave_request",
            entityId: persistedLeaveRequest.id,
            oldValue: auditDiff.oldValue,
            newValue: auditDiff.newValue,
          },
          manager
        );
      }

      return persistedLeaveRequest;
    });

    return this.getLeaveRequest(savedLeaveRequest.id);
  }

  async reviewLeaveRequest(
    id: string,
    reviewerId: string,
    status: LeaveStatus.APPROVED | LeaveStatus.REJECTED,
    reviewRemarks?: string | null
  ) {
    const leaveRequest = await this.findLeaveRequestEntity(id);

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new Error("Only pending leave requests can be reviewed");
    }

    const previousSnapshot = buildLeaveSnapshot(leaveRequest);
    const reviewYear = new Date(leaveRequest.startDate).getUTCFullYear();

    const savedLeaveRequest = await AppDataSource.transaction(async (manager) => {
      if (status === LeaveStatus.APPROVED) {
        await leaveBalanceService.approveLeave(
          {
            employeeId: leaveRequest.userId,
            leaveTypeId: leaveRequest.leaveTypeId,
            days: Number(leaveRequest.totalDays),
            year: reviewYear,
          },
          leaveRequest.user?.tenantId ?? undefined,
          manager
        );
      } else {
        await leaveBalanceService.releasePendingLeave(
          {
            employeeId: leaveRequest.userId,
            leaveTypeId: leaveRequest.leaveTypeId,
            days: Number(leaveRequest.totalDays),
            year: reviewYear,
          },
          leaveRequest.user?.tenantId ?? undefined,
          manager
        );
      }

      leaveRequest.status = status;
      leaveRequest.reviewedBy = reviewerId;
      leaveRequest.reviewedAt = new Date();
      leaveRequest.reviewRemarks = normalizeOptionalText(reviewRemarks) ?? null;

      const persistedLeaveRequest = await leaveRequestRepo.save(leaveRequest);
      const auditDiff = buildAuditDiff(
        previousSnapshot,
        buildLeaveSnapshot(persistedLeaveRequest)
      );

      if (auditDiff.hasChanges) {
        await auditLogService.log(
          {
            actorUserId: reviewerId,
            action:
              status === LeaveStatus.APPROVED
                ? "LEAVE_REQUEST_APPROVED"
                : "LEAVE_REQUEST_REJECTED",
            entityType: "leave_request",
            entityId: persistedLeaveRequest.id,
            oldValue: auditDiff.oldValue,
            newValue: auditDiff.newValue,
          },
          manager
        );
      }

      return persistedLeaveRequest;
    });

    return this.getLeaveRequest(savedLeaveRequest.id);
  }

  async approveLeaveRequest(
    id: string,
    reviewerId: string,
    reviewRemarks?: string | null
  ) {
    return this.reviewLeaveRequest(
      id,
      reviewerId,
      LeaveStatus.APPROVED,
      reviewRemarks
    );
  }

  async cancelLeaveRequest(
    id: string,
    actorUserId: string,
    reviewRemarks?: string | null
  ) {
    const leaveRequest = await this.findLeaveRequestEntity(id);

    if (
      leaveRequest.status !== LeaveStatus.PENDING &&
      leaveRequest.status !== LeaveStatus.APPROVED
    ) {
      throw new Error("Only pending or approved leave requests can be cancelled");
    }

    const previousSnapshot = buildLeaveSnapshot(leaveRequest);
    const cancelYear = new Date(leaveRequest.startDate).getUTCFullYear();

    const savedLeaveRequest = await AppDataSource.transaction(async (manager) => {
      if (leaveRequest.status === LeaveStatus.PENDING) {
        await leaveBalanceService.releasePendingLeave(
          {
            employeeId: leaveRequest.userId,
            leaveTypeId: leaveRequest.leaveTypeId,
            days: Number(leaveRequest.totalDays),
            year: cancelYear,
          },
          leaveRequest.user?.tenantId ?? undefined,
          manager
        );
      } else {
        await leaveBalanceService.restoreApprovedLeave(
          {
            employeeId: leaveRequest.userId,
            leaveTypeId: leaveRequest.leaveTypeId,
            days: Number(leaveRequest.totalDays),
            year: cancelYear,
          },
          leaveRequest.user?.tenantId ?? undefined,
          manager
        );
      }

      leaveRequest.status = LeaveStatus.CANCELLED;
      leaveRequest.reviewedBy = actorUserId;
      leaveRequest.reviewedAt = new Date();
      leaveRequest.reviewRemarks = normalizeOptionalText(reviewRemarks) ?? null;

      const persistedLeaveRequest = await leaveRequestRepo.save(leaveRequest);
      await auditLogService.log(
        {
          actorUserId,
          action: "LEAVE_REQUEST_CANCELLED",
          entityType: "leave_request",
          entityId: persistedLeaveRequest.id,
          oldValue: previousSnapshot,
          newValue: buildLeaveSnapshot(persistedLeaveRequest),
        },
        manager
      );

      return persistedLeaveRequest;
    });

    return this.getLeaveRequest(savedLeaveRequest.id);
  }
}
