import { In, LessThanOrEqual, MoreThanOrEqual, Not } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { LeaveRequest } from "../entities/LeaveRequest";
import { LeaveType } from "../entities/LeaveType";
import { User } from "../entities/User";
import { auditLogService, buildAuditDiff } from "./audit-log.service";
import { LeaveStatus } from "../utils/leave-status.enum";

const leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);
const leaveTypeRepo = AppDataSource.getRepository(LeaveType);
const userRepo = AppDataSource.getRepository(User);

type NullableInput = string | null | undefined;

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

const normalizeOptionalText = (value: NullableInput) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const parseDateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return date;
};

const calculateLeaveDays = (startDate: string, endDate: string) => {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (end < start) {
    throw new Error("endDate cannot be before startDate");
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
};

const serializeUser = (user: User | null) =>
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

  private serializeLeaveRequest(leaveRequest: LeaveRequest) {
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
      createdAt: leaveRequest.createdAt?.toISOString?.(),
      updatedAt: leaveRequest.updatedAt?.toISOString?.(),
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
      userId,
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
      description: normalizeOptionalText(data.description) ?? null,
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
      leaveType.description = normalizeOptionalText(data.description) ?? null;
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

    const savedLeaveType = await leaveTypeRepo.save(leaveType);
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
  ) {
    const user = await this.ensureUser(data.userId);
    const leaveType = await this.ensureActiveLeaveType(data.leaveTypeId);
    const totalDays = calculateLeaveDays(data.startDate, data.endDate);

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
        status: LeaveStatus.PENDING,
        reviewedBy: null,
        reviewedAt: null,
        reviewRemarks: null,
      });

      const savedLeaveRequest = await manager.save(LeaveRequest, leaveRequest);
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

    return this.getLeaveRequest(leaveRequestId);
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
      query.andWhere("leaveRequest.userId IN (:...accessibleUserIds)", {
        accessibleUserIds: input.accessibleUserIds,
      });
    }

    if (input.userId) {
      query.andWhere("leaveRequest.userId = :userId", {
        userId: input.userId,
      });
    }

    if (input.status) {
      query.andWhere("leaveRequest.status = :status", {
        status: input.status,
      });
    }

    if (input.leaveTypeId) {
      query.andWhere("leaveRequest.leaveTypeId = :leaveTypeId", {
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
    return this.serializeLeaveRequest(leaveRequest);
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
          userId: input.userId,
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

    leaveRequest.totalDays = calculateLeaveDays(
      leaveRequest.startDate,
      leaveRequest.endDate
    );

    await this.ensureNoOverlappingPendingOrApprovedLeave(
      leaveRequest.userId,
      leaveRequest.startDate,
      leaveRequest.endDate,
      leaveRequest.id
    );

    const savedLeaveRequest = await leaveRequestRepo.save(leaveRequest);
    const nextSnapshot = buildLeaveSnapshot(savedLeaveRequest);
    const auditDiff = buildAuditDiff(previousSnapshot, nextSnapshot);

    if (auditDiff.hasChanges) {
      await auditLogService.log({
        actorUserId: options.actorUserId ?? null,
        action: "LEAVE_REQUEST_UPDATED",
        entityType: "leave_request",
        entityId: savedLeaveRequest.id,
        oldValue: auditDiff.oldValue,
        newValue: auditDiff.newValue,
      });
    }

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
    leaveRequest.status = status;
    leaveRequest.reviewedBy = reviewerId;
    leaveRequest.reviewedAt = new Date();
    leaveRequest.reviewRemarks = normalizeOptionalText(reviewRemarks) ?? null;

    const savedLeaveRequest = await leaveRequestRepo.save(leaveRequest);
    const auditDiff = buildAuditDiff(
      previousSnapshot,
      buildLeaveSnapshot(savedLeaveRequest)
    );

    if (auditDiff.hasChanges) {
      await auditLogService.log({
        actorUserId: reviewerId,
        action:
          status === LeaveStatus.APPROVED
            ? "LEAVE_REQUEST_APPROVED"
            : "LEAVE_REQUEST_REJECTED",
        entityType: "leave_request",
        entityId: savedLeaveRequest.id,
        oldValue: auditDiff.oldValue,
        newValue: auditDiff.newValue,
      });
    }

    return this.getLeaveRequest(savedLeaveRequest.id);
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
    leaveRequest.status = LeaveStatus.CANCELLED;
    leaveRequest.reviewedBy = actorUserId;
    leaveRequest.reviewedAt = new Date();
    leaveRequest.reviewRemarks = normalizeOptionalText(reviewRemarks) ?? null;

    const savedLeaveRequest = await leaveRequestRepo.save(leaveRequest);
    await auditLogService.log({
      actorUserId,
      action: "LEAVE_REQUEST_CANCELLED",
      entityType: "leave_request",
      entityId: savedLeaveRequest.id,
      oldValue: previousSnapshot,
      newValue: buildLeaveSnapshot(savedLeaveRequest),
    });

    return this.getLeaveRequest(savedLeaveRequest.id);
  }
}
