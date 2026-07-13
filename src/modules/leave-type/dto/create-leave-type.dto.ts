export interface CreateLeaveTypeDto {
  name: string;
  code: string;
  description?: string;

  isPaid?: boolean;
  requiresApproval?: boolean;

  allowHalfDay?: boolean;
  allowHourly?: boolean;

  requiresDocument?: boolean;
}
