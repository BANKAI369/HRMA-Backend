import { AppDataSource } from "../../config/data-source";
import { LeaveRequest } from '../../entities/LeaveRequest';
import {
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  ApproveLeaveRequestDto,
} from './dto/leave-request.dto';
import { LeaveStatus } from '../../utils/leave-status.enum';

const leaveRequestRepo = AppDataSource.getRepository(LeaveRequest);

export class LeaveRequestService {
  constructor() {}

  async create(
    userId: string,
    dto: CreateLeaveRequestDto,
  ) {
    const startDate = dto.fromDate;
    const endDate = dto.toDate;

    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays =
      Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / msPerDay) + 1;

    const leaveRequest = leaveRequestRepo.create({
      user: { id: userId },
      leaveTypeId: dto.leaveTypeId,
      startDate,
      endDate,
      totalDays,
      reason: dto.reason ?? null,
      status: LeaveStatus.PENDING,
    });

    return leaveRequestRepo.save(leaveRequest);
  }

  async findAll() {
    return leaveRequestRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    const request = await leaveRequestRepo.findOne({
      where: { id },
    });

    if (!request) {
      throw new Error('Leave request not found');
    }

    return request;
  }

  async findMyRequests(userId: string) {
    return leaveRequestRepo.find({
      where: { user: { id: userId } },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async update(
    id: string,
    dto: UpdateLeaveRequestDto,
  ) {
    const request = await this.findOne(id);

    if (dto.fromDate !== undefined) request.startDate = dto.fromDate;
    if (dto.toDate !== undefined) request.endDate = dto.toDate;
    if (dto.reason !== undefined) request.reason = dto.reason ?? null;

    // Recompute totalDays if dates changed
    if (dto.fromDate !== undefined || dto.toDate !== undefined) {
      const msPerDay = 24 * 60 * 60 * 1000;
      request.totalDays = Math.floor((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / msPerDay) + 1;
    }

    return leaveRequestRepo.save(request);
  }

  async review(
    id: string,
    reviewerId: string,
    dto: ApproveLeaveRequestDto,
  ) {
    const request = await this.findOne(id);

    request.status = dto.status as any;
    request.reviewedBy = reviewerId;
    request.reviewRemarks = dto.reviewComment ?? null;
    request.reviewedAt = new Date();

    return leaveRequestRepo.save(request);
  }

  async cancel(id: string) {
    const request = await this.findOne(id);

    request.status = LeaveStatus.CANCELLED as any;

    return leaveRequestRepo.save(request);
  }
}
