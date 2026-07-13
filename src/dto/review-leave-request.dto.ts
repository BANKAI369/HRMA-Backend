import { IsEnum, IsOptional, IsString } from "class-validator";
import { LeaveStatus } from "../utils/leave-status.enum";

export class ReviewLeaveRequestDto {
  @IsEnum(LeaveStatus)
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;

  @IsOptional()
  @IsString()
  reviewRemarks?: string;
}