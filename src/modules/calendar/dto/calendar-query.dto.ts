import { IsOptional, IsDateString, IsUUID, IsString } from "class-validator";

export class CalendarQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  userId?: string;

  @IsOptional()
  departmentId?: string;
}