import { AppDataSource } from "../config/data-source";
import { ExitReason } from "../entities/ExitReason";
import { ExitRequest } from "../entities/ExitRequest";
import { NoticePeriod } from "../entities/NoticePeriod";
import { User } from "../entities/User";

const exitRequestRepository = AppDataSource.getRepository(ExitRequest);
const userRepository = AppDataSource.getRepository(User);
const exitReasonRepository = AppDataSource.getRepository(ExitReason);
const noticePeriodRepository = AppDataSource.getRepository(NoticePeriod);

type NullableInput = string | null | undefined;

export type CreateExitRequestInput = {
  employeeUserId: string;
  requestedByUserId: string;
  exitReasonId: string;
  noticePeriodId?: string | null;
  lastWorkingDate?: string | null;
  remarks?: string | null;
};

export type UpdateExitRequestInput = {
  exitReasonId?: string;
  noticePeriodId?: string | null;
  lastWorkingDate?: string | null;
  remarks?: string | null;
  status?: string;
};

const normalizeOptionalValue = (value: NullableInput) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const serializeUser = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
});

export class ExitRequestService {
  private async resolveUser(userId: string, label: string) {
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ["role", "department"],
    });

    if (!user) {
      throw new Error(`${label} not found`);
    }

    return user;
  }

  private async resolveExitReason(exitReasonId: string) {
    const exitReason = await exitReasonRepository.findOne({
      where: { id: exitReasonId },
    });

    if (!exitReason) {
      throw new Error("Exit reason not found");
    }

    return exitReason;
  }

  private async resolveNoticePeriod(noticePeriodId: NullableInput) {
    const normalizedNoticePeriodId = normalizeOptionalValue(noticePeriodId);
    if (normalizedNoticePeriodId === undefined) {
      return undefined;
    }

    if (normalizedNoticePeriodId === null) {
      return null;
    }

    const noticePeriod = await noticePeriodRepository.findOne({
      where: { id: normalizedNoticePeriodId },
    });

    if (!noticePeriod) {
      throw new Error("Notice period not found");
    }

    return noticePeriod;
  }

  private serialize(exitRequest: ExitRequest) {
    return {
      id: exitRequest.id,
      employee: serializeUser(exitRequest.employeeUser),
      requestedBy: serializeUser(exitRequest.requestedByUser),
      exitReason: {
        id: exitRequest.exitReason.id,
        name: exitRequest.exitReason.name,
      },
      noticePeriod: exitRequest.noticePeriod
        ? {
            id: exitRequest.noticePeriod.id,
            name: exitRequest.noticePeriod.name,
            days: exitRequest.noticePeriod.days,
          }
        : null,
      lastWorkingDate: exitRequest.lastWorkingDate,
      status: exitRequest.status,
      remarks: exitRequest.remarks,
      createdAt: exitRequest.createdAt?.toISOString?.(),
      updatedAt: exitRequest.updatedAt?.toISOString?.(),
    };
  }

  async findOne(id: string) {
    const exitRequest = await exitRequestRepository.findOne({
      where: { id },
      relations: [
        "employeeUser",
        "requestedByUser",
        "exitReason",
        "noticePeriod",
      ],
    });

    if (!exitRequest) {
      throw new Error("Exit request not found");
    }

    return exitRequest;
  }

  async create(data: CreateExitRequestInput) {
    const employeeUser = await this.resolveUser(
      data.employeeUserId,
      "Employee"
    );
    const requestedByUser = await this.resolveUser(
      data.requestedByUserId,
      "Requester"
    );
    const exitReason = await this.resolveExitReason(data.exitReasonId);
    const noticePeriod = await this.resolveNoticePeriod(data.noticePeriodId);

    const activeRequest = await exitRequestRepository.findOne({
      where: {
        employeeUserId: employeeUser.id,
        status: "Pending",
      },
    });

    if (activeRequest) {
      throw new Error("Employee already has a pending exit request");
    }

    const exitRequest = exitRequestRepository.create({
      employeeUser,
      employeeUserId: employeeUser.id,
      requestedByUser,
      requestedByUserId: requestedByUser.id,
      exitReason,
      exitReasonId: exitReason.id,
      noticePeriod: noticePeriod ?? null,
      noticePeriodId: noticePeriod?.id ?? null,
      lastWorkingDate: normalizeOptionalValue(data.lastWorkingDate) ?? null,
      remarks: normalizeOptionalValue(data.remarks) ?? null,
      status: "Pending",
    });

    const savedRequest = await exitRequestRepository.save(exitRequest);
    const hydratedRequest = await this.findOne(savedRequest.id);
    return this.serialize(hydratedRequest);
  }

  async update(id: string, data: UpdateExitRequestInput) {
    const exitRequest = await this.findOne(id);

    if (data.exitReasonId !== undefined) {
      const exitReason = await this.resolveExitReason(data.exitReasonId);
      exitRequest.exitReason = exitReason;
      exitRequest.exitReasonId = exitReason.id;
    }

    const noticePeriod = await this.resolveNoticePeriod(data.noticePeriodId);
    if (noticePeriod !== undefined) {
      exitRequest.noticePeriod = noticePeriod;
      exitRequest.noticePeriodId = noticePeriod?.id ?? null;
    }

    if (data.lastWorkingDate !== undefined) {
      exitRequest.lastWorkingDate =
        normalizeOptionalValue(data.lastWorkingDate) ?? null;
    }

    if (data.remarks !== undefined) {
      exitRequest.remarks = normalizeOptionalValue(data.remarks) ?? null;
    }

    if (data.status !== undefined) {
      exitRequest.status = data.status.trim();
    }

    const savedRequest = await exitRequestRepository.save(exitRequest);
    const hydratedRequest = await this.findOne(savedRequest.id);
    return this.serialize(hydratedRequest);
  }
}
