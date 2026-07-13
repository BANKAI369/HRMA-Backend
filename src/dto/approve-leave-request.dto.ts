import { IsOptional, IsString } from "class-validator";

export class ApproveLeaveRequestDto {
  @IsOptional()
  @IsString()
  reviewRemarks?: string;
}
