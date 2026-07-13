import { IsOptional, IsString } from "class-validator";

export class CancelLeaveRequestDto {
  @IsOptional()
  @IsString()
  reviewRemarks?: string;
}