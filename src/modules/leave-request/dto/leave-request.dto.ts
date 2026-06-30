import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { LeaveStatus } from "../../enum/leaveStatus.enum";

/**
 * CREATE DTO
 */
export class CreateLeaveRequestDto {
  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsString()
  leaveTypeId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * UPDATE DTO
 */
export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  leaveTypeId?: string;
}

/**
 * APPROVE / REJECT DTO
 */
export class ApproveLeaveRequestDto {
  @IsEnum(LeaveStatus)
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;

  @IsOptional()
  @IsString()
  reviewComment?: string;
}
