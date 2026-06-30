export interface CreatePolicyRuleDto {
  leaveTypeId: string;

  annualQuota: number;

  accrualEnabled?: boolean;

  accrualFrequency?: string;

  carryForwardEnabled?: boolean;

  carryForwardLimit?: number;

  encashmentAllowed?: boolean;

  negativeBalanceAllowed?: boolean;

  maxConsecutiveDays?: number;
}
