import { IsOptional, IsString } from "class-validator";

export class CancelLeaveDto {
  @IsOptional()
  @IsString()
  reviewRemarks?: string;
}
