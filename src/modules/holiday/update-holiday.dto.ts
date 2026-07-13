import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { HolidayType } from "./Entity";

export class UpdateHolidayDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(HolidayType)
  type?: HolidayType;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}